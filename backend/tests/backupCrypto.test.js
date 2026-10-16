const test = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { promises: fs } = require("node:fs");
const { parseBackupKey, encryptBackup, decryptBackup } = require("../scripts/backupCrypto");

test("backups encrypt and restore exact bytes using authenticated encryption", async t => {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "manageos-backup-test-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const input = path.join(dir, "source.dump"), encrypted = path.join(dir, "export.enc");
  const restored = path.join(dir, "restored.dump");
  const secret = randomBytes(32);
  const original = randomBytes(75000);
  await fs.writeFile(input, original);
  await encryptBackup(input, encrypted, secret);
  const ciphertext = await fs.readFile(encrypted);
  assert.equal(ciphertext.subarray(0, 10).toString(), "MOSBACKUP1");
  assert.equal(ciphertext.includes(original.subarray(0, 24)), false);
  await decryptBackup(encrypted, restored, secret);
  assert.deepEqual(await fs.readFile(restored), original);
});

test("tampering or wrong decryption key rejects backups and removes output", async t => {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "manageos-backup-integrity-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const source = path.join(dir, "raw"), sealed = path.join(dir, "sealed"), plain = path.join(dir, "plain");
  const key = randomBytes(32);
  await fs.writeFile(source, randomBytes(124));
  await encryptBackup(source, sealed, key);
  await assert.rejects(decryptBackup(sealed, plain, randomBytes(32)), /BACKUP_AUTHENTICATION_FAILED/);
  await assert.rejects(fs.stat(plain), { code: "ENOENT" });
  const bytes = await fs.readFile(sealed);
  bytes[24] ^= 1;
  await fs.writeFile(sealed, bytes);
  await assert.rejects(decryptBackup(sealed, plain, key), /BACKUP_AUTHENTICATION_FAILED/);
});

test("invalid encryption keys fail closed", () => {
  assert.throws(() => parseBackupKey({ MANAGEOS_BACKUP_ENCRYPTION_KEY: "weak" }), /BACKUP_ENCRYPTION_KEY_INVALID/);
  assert.equal(parseBackupKey({ MANAGEOS_BACKUP_ENCRYPTION_KEY: randomBytes(32).toString("hex") }).length, 32);
});
