function readEmailConfig(env = process.env) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  const from = String(env.RESEND_FROM_EMAIL || "").trim();
  const url = String(env.PUBLIC_APP_URL || "").trim();

  // Missing is different from malformed. Don't pretend email was delivered.
  if (!apiKey || !from || !url) return null;
  if (!apiKey.startsWith("re_") || apiKey.length < 8) {
    throw new Error("EMAIL_API_KEY_INVALID");
  }
  if (/[\r\n]/.test(from) || from.length > 240 ||
      !/^(?:[^<>\r\n]+\s*<)?[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}>?$/i.test(from)) {
    throw new Error("EMAIL_SENDER_INVALID");
  }
  let origin;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) ||
        parsed.username || parsed.password || parsed.search || parsed.hash ||
        parsed.pathname !== "/") throw new Error("EMAIL_PUBLIC_URL_INVALID");
    if (env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      throw new Error("EMAIL_PUBLIC_URL_INSECURE");
    }
    origin = parsed.origin;
  } catch (error) {
    if (error.message === "EMAIL_PUBLIC_URL_INSECURE") throw error;
    throw new Error("EMAIL_PUBLIC_URL_INVALID");
  }
  return { apiKey, from, origin };
}

function emailConfigured(env = process.env) {
  try { return Boolean(readEmailConfig(env)); }
  catch { return false; }
}

module.exports = { readEmailConfig, emailConfigured };
