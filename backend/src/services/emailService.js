const { readEmailConfig, emailConfigured } = require("../config/emailConfig");
const { sendGmailEmail } = require("./gmailApiService");
const { sendAppsScriptEmail } = require("./appsScriptEmailService");

function configured() {
  return emailConfigured();
}

async function sendEmail({ to, subject, text, idempotencyKey }) {
  const config = readEmailConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  if (config.provider === "gmail") {
    return sendGmailEmail({ to, subject, text, config });
  }
  if (config.provider === "apps_script") {
    return sendAppsScriptEmail({ to, subject, text, idempotencyKey, config });
  }
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

async function sendInvitationEmail({ to, token, companyName, invitationId, roleName, organizationUnitName }) {
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
      roleName ? "Your assigned role: " + String(roleName).replaceAll("_", " ") : "",
      organizationUnitName ? "Department: " + String(organizationUnitName) : "Company-wide access, according to your role.",
      "You can verify your company and role before creating a password.",
      "Accept your invitation using this private link within seven days:",
      link.toString(),
      "If you weren't expecting this invitation, you can ignore this email.",
    ].join("\n\n"),
    idempotencyKey: `manageos-invitation-${invitationId}`,
  });
}

async function sendCompanyVerificationEmail({ to, token, companyName, registrationId }) {
  const config = readEmailConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  const url = new URL("/verify-email", config.origin);
  url.searchParams.set("token", token);
  const safeCompany = String(companyName || "your company")
    .replace(/[\r\n]+/g, " ").trim().slice(0, 120);
  return sendEmail({
    to,
    subject: "Verify your email to create " + safeCompany + " on ManageOS",
    text: [
      "You started creating a company workspace on ManageOS for " + safeCompany + ".",
      "Confirm that you own this email address to activate the company.",
      "This private, single-use verification link expires in 24 hours:",
      url.toString(),
      "If you did not request this, ignore this email. No company has been created."
    ].join("\n\n"),
    idempotencyKey: "manageos-owner-verification-" + registrationId
  });
}

module.exports = {
  configured, sendPasswordResetEmail, sendInvitationEmail, sendCompanyVerificationEmail
};
