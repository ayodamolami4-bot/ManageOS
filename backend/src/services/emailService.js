const DEFAULT_FROM = "ManageOS <support@manageos.example>";

function configured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    process.env.PUBLIC_APP_URL
  );
}

async function sendPasswordResetEmail({ to, token }) {
  if (!configured()) throw new Error("EMAIL_NOT_CONFIGURED");
  const appUrl = new URL(process.env.PUBLIC_APP_URL);
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("EMAIL_PUBLIC_URL_INSECURE");
  }
  if (!["http:", "https:"].includes(appUrl.protocol)) throw new Error("EMAIL_PUBLIC_URL_INVALID");

  const resetUrl = new URL("/reset-password", appUrl.origin);
  resetUrl.searchParams.set("token", token);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "ManageOS/1.0",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        subject: "Reset your ManageOS password",
        text: [
          "We received a request to reset your ManageOS account password.",
          "Open this link within 30 minutes:",
          resetUrl.toString(),
          "If you didn't request this, you can ignore this email."
        ].join("\n\n"),
      }),
    });
    if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}


async function sendInvitationEmail({ to, token, companyName, invitationId }) {
  if (!configured()) throw new Error("EMAIL_NOT_CONFIGURED");
  const appUrl = new URL(process.env.PUBLIC_APP_URL);
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("EMAIL_PUBLIC_URL_INSECURE");
  }
  if (!["https:", "http:"].includes(appUrl.protocol)) {
    throw new Error("EMAIL_PUBLIC_URL_INVALID");
  }
  const link = new URL("/invite", appUrl.origin);
  link.searchParams.set("token", token);
  const safeCompany = String(companyName || "a company using ManageOS").slice(0, 200);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "ManageOS/1.0",
        "Idempotency-Key": `manageos-invitation-${invitationId}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject: "You're invited to join " + safeCompany + " on ManageOS",
        text: [
          "You've been invited to join " + safeCompany + " on ManageOS.",
          "Accept your invitation using this private link within seven days:",
          link.toString(),
          "If you weren't expecting this invitation, you can ignore this email.",
        ].join("\n\n"),
      }),
    });
    if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { configured, sendPasswordResetEmail, sendInvitationEmail };
