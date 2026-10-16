const { randomBytes, createCipheriv, createDecipheriv } = require("node:crypto");
const fs = require("node:fs");
const { promises: fsp, createReadStream, createWriteStream } = fs;
const { pipeline } = require("node:stream/promises");

// Files contain: 10-byte signature | 12-byte unique IV | ciphertext | 16-byte GCM tag.
// The AES key is never written into a backup, logs or the repository.
const SIGNATURE = Buffer.from("MOSBACKUP1");
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function parseBackupKey(env = process.env) {
  const hex = env.MANAGEOS_BACKUP_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(hex)) {
    throw new Error("BACKUP_ENCRYPTION_KEY_INVALID: expected 32 random bytes in hex");
  }
  return Buffer.from(hex, "hex");
}

async function encryptBackup(input, output, key) {
  const iv = randomBytes(IV_LENGTH);
  await fsp.writeFile(output, Buffer.concat([SIGNATURE, iv]), { flag: "wx", mode: 0o600 });
  try {
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    await pipeline(createReadStream(input), cipher, createWriteStream(output, { flags: "a", mode: 0o600 }));
    await fsp.appendFile(output, cipher.getAuthTag());
  } catch (error) {
    await fsp.rm(output, { force: true });
    throw error;
  }
}

async function decryptBackup(input, output, key) {
  const file = await fsp.open(input, "r");
  let size;
  const header = Buffer.alloc(SIGNATURE.length + IV_LENGTH);
  const tag = Buffer.alloc(TAG_LENGTH);
  try {
    size = (await file.stat()).size;
    if (size <= header.length + TAG_LENGTH) throw new Error("BACKUP_FILE_INVALID");
    await file.read(header, 0, header.length, 0);
    await file.read(tag, 0, TAG_LENGTH, size - TAG_LENGTH);
  } finally {
    await file.close();
  }
  if (!header.subarray(0, SIGNATURE.length).equals(SIGNATURE)) {
    throw new Error("BACKUP_FILE_INVALID");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(SIGNATURE.length));
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      createReadStream(input, { start: header.length, end: size - TAG_LENGTH - 1 }),
      decipher,
      createWriteStream(output, { flags: "wx", mode: 0o600 })
    );
  } catch (_error) {
    await fsp.rm(output, { force: true });
    throw new Error("BACKUP_AUTHENTICATION_FAILED");
  }
}

if (require.main === module) {
  (async () => {
    const [action, input, output] = process.argv.slice(2);
    if (!["encrypt", "decrypt"].includes(action) || !input || !output) {
      throw new Error("Usage: node backupCrypto.js encrypt|decrypt <input> <output>");
    }
    const key = parseBackupKey();
    try {
      if (action === "encrypt") await encryptBackup(input, output, key);
      else await decryptBackup(input, output, key);
    } finally {
      key.fill(0);
    }
    console.log("Verified backup crypto operation:", action);
  })().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseBackupKey, encryptBackup, decryptBackup };
