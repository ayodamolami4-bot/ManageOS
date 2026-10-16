// Apps Script MailApp sender uses HTTPS so it works with Render Free.
// The endpoint and shared secret exist ONLY in server-side environment variables.
// The web app must be owned by the designated ManageOS Gmail sender.
const ADDRESS = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

async function sendAppsScriptEmail({
  to, subject, text, idempotencyKey, config, fetchImpl = fetch
}) {
  const recipient = String(to || "").trim();
  const title = String(subject || "").trim();
  const body = String(text || "");
  if (!ADDRESS.test(recipient) || recipient.length > 254 ||
      /[\r\n]/.test(recipient)) throw new Error("EMAIL_ADDRESS_INVALID");
  if (!title || title.length > 240 || /[\r\n]/.test(title)) {
    throw new Error("EMAIL_SUBJECT_INVALID");
  }
  if (!body || body.length > 16000) throw new Error("EMAIL_BODY_INVALID");
  const key = idempotencyKey ? String(idempotencyKey) : "";
  if (key && !/^[a-zA-Z0-9_.-]{1,160}$/.test(key)) {
    throw new Error("EMAIL_IDEMPOTENCY_KEY_INVALID");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetchImpl(config.endpoint, {
      method: "POST",
      redirect: "follow", // Google's ContentService redirects JSON responses.
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ManageOS/1.0"
      },
      body: JSON.stringify({
        secret: config.sharedSecret, to: recipient,
        subject: title, text: body, idempotencyKey: key
      })
    });
    if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
    // Apps Script may return HTTP 200 even for a rejected secret or quota error.
    // Check the body rather than equating a 200 response with sent mail.
    const result = await response.json();
    if (result?.ok !== true) throw new Error("EMAIL_DELIVERY_FAILED");
  } catch {
    // Never log Google response bodies, invitation tokens, or the shared secret.
    throw new Error("EMAIL_DELIVERY_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendAppsScriptEmail };
