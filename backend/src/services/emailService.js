const { readEmailConfig, emailConfigured } = require("../config/emailConfig");

function configured() {
  return emailConfigured();
}

async function sendEmail({ to, subject, text, idempotencyKey }) {
  const config = readEmailConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ManageOS/1.0",
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify({ from: config.from, to: [to], subject, text }),
    });
    // Never include provider response bodies; they may contain sensitive data.
    if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

async function sendPasswordResetEmail({ to, token }) {
  const config = readEmailConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  const resetUrl = new URL("/reset-password", config.origin);
  resetUrl.searchParams.set("token", token);
  return sendEmail({
    to,
    subject: "Reset your ManageOS password",
    text: [
      "We received a request to reset your ManageOS account password.",
      "Open this link within 30 minutes:",
      resetUrl.toString(),
      "If you didn't request this, you can ignore this email.",
    ].join("\n\n"),
  });
}

async function sendInvitationEmail({ to, token, companyName, invitationId }) {
  const config = readEmailConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  const link = new URL("/invite", config.origin);
  link.searchParams.set("token", token);
  const safeCompany = String(companyName || "a company using ManageOS").slice(0, 200);
  return sendEmail({
    to,
    subject: "You're invited to join " + safeCompany + " on ManageOS",
    text: [
      "You've been invited to join " + safeCompany + " on ManageOS.",
      "Accept your invitation using this private link within seven days:",
      link.toString(),
      "If you weren't expecting this invitation, you can ignore this email.",
    ].join("\n\n"),
    idempotencyKey: `manageos-invitation-${invitationId}`,
  });
}

module.exports = { configured, sendPasswordResetEmail, sendInvitationEmail };
