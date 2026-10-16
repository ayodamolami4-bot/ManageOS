// Gmail API uses HTTPS: Render Free blocks outbound SMTP ports.
// Only one ManageOS-owned sender is authorized. No access to an owner's Gmail
// or to recipient mailboxes is requested. Scope: gmail.send only.
const ADDRESS = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function buildRawMessage({ sender, to, subject, text }) {
  const recipient = String(to || "").trim();
  const from = String(sender || "").trim();
  if (!ADDRESS.test(recipient) || !ADDRESS.test(from) ||
      recipient.length > 254 || from.length > 254 ||
      /[\r\n]/.test(recipient + from)) {
    throw new Error("EMAIL_ADDRESS_INVALID");
  }
  const title = String(subject || "").replace(/[\r\n]+/g, " ").trim();
  if (!title || title.length > 240) throw new Error("EMAIL_SUBJECT_INVALID");
  const encodedSubject = "=?UTF-8?B?" + Buffer.from(title, "utf8").toString("base64") + "?=";
  const base64Body = Buffer.from(String(text), "utf8").toString("base64")
    .replace(/.{1,76}/g, "$&\r\n").trimEnd();
  const mime = [
    "From: ManageOS <" + from + ">",
    "To: " + recipient,
    "Subject: " + encodedSubject,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Body
  ].join("\r\n") + "\r\n";
  return Buffer.from(mime, "utf8").toString("base64url");
}

async function gmailFetch(url, options, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch {
    // Do not log request headers, refresh tokens, credentials, or reset links.
    throw new Error("EMAIL_DELIVERY_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

async function sendGmailEmail({ to, subject, text, config, fetchImpl = fetch }) {
  const raw = buildRawMessage({ sender: config.sender, to, subject, text });
  const refresh = await gmailFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.oauthClientId,
      client_secret: config.oauthClientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token"
    }).toString()
  }, fetchImpl);
  if (!refresh.ok) throw new Error("EMAIL_DELIVERY_FAILED");
  let tokens;
  try { tokens = await refresh.json(); }
  catch { throw new Error("EMAIL_DELIVERY_FAILED"); }
  if (!tokens?.access_token || typeof tokens.access_token !== "string") {
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
  const response = await gmailFetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + tokens.access_token,
        "Content-Type": "application/json",
        "User-Agent": "ManageOS/1.0"
      },
      body: JSON.stringify({ raw })
    }, fetchImpl
  );
  if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}

module.exports = { buildRawMessage, sendGmailEmail };
