const SIMPLE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const DISPLAY_EMAIL = /^[^<>\r\n]{1,100}\s+<[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}>$/i;

function requirePublicOrigin(env) {
  const url = String(env.PUBLIC_APP_URL || "").trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) ||
        parsed.username || parsed.password || parsed.search || parsed.hash ||
        parsed.pathname !== "/") throw new Error("EMAIL_PUBLIC_URL_INVALID");
    if (env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      throw new Error("EMAIL_PUBLIC_URL_INSECURE");
    }
    return parsed.origin;
  } catch (error) {
    if (error.message === "EMAIL_PUBLIC_URL_INSECURE") throw error;
    throw new Error("EMAIL_PUBLIC_URL_INVALID");
  }
}

function readEmailConfig(env = process.env) {
  const provider = String(env.EMAIL_PROVIDER || "resend").trim().toLowerCase();
  const origin = requirePublicOrigin(env);
  if (provider === "gmail") {
    const sender = String(env.GMAIL_SENDER_EMAIL || "").trim();
    const oauthClientId = String(env.GMAIL_OAUTH_CLIENT_ID || "").trim();
    const oauthClientSecret = String(env.GMAIL_OAUTH_CLIENT_SECRET || "").trim();
    const refreshToken = String(env.GMAIL_OAUTH_REFRESH_TOKEN || "").trim();
    // No guessing credentials and no fall-through to another sender.
    if (!sender || !oauthClientId || !oauthClientSecret || !refreshToken || !origin) return null;
    if (!SIMPLE_EMAIL.test(sender) || sender.length > 254 || /[\r\n]/.test(sender)) {
      throw new Error("EMAIL_SENDER_INVALID");
    }
    if ([oauthClientId, oauthClientSecret, refreshToken].some(x => /[\r\n]/.test(x))) {
      throw new Error("EMAIL_OAUTH_CONFIG_INVALID");
    }
    return { provider, origin, from: `ManageOS <${sender}>`,
      sender, oauthClientId, oauthClientSecret, refreshToken };
  }
  if (provider !== "resend") throw new Error("EMAIL_PROVIDER_INVALID");
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  const from = String(env.RESEND_FROM_EMAIL || "").trim();
  if (!apiKey || !from || !origin) return null;
  if (!apiKey.startsWith("re_") || apiKey.length < 8) {
    throw new Error("EMAIL_API_KEY_INVALID");
  }
  if (/[\r\n]/.test(from) || from.length > 240 ||
      (!SIMPLE_EMAIL.test(from) && !DISPLAY_EMAIL.test(from))) {
    throw new Error("EMAIL_SENDER_INVALID");
  }
  return { provider, apiKey, from, origin };
}

function emailConfigured(env = process.env) {
  try { return Boolean(readEmailConfig(env)); }
  catch { return false; }
}

module.exports = { readEmailConfig, emailConfigured };
