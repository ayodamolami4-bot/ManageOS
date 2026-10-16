# Gmail API sender (no domain and no payment)

**Status:** Code is implemented and covered by mocked tests, but **no live Gmail
authorization or delivery has been verified**. The live ManageOS server must
continue to report email unavailable until all required credentials are set
privately. Do not use a personal password, an SMTP App Password or a ChatGPT
Gmail connector as API credentials for the production backend.

## Why Gmail API and not SMTP

Render Free blocks outbound SMTP ports. The backend uses the Gmail API over
HTTPS: Google OAuth refresh-token endpoint followed by Gmail's
`users.messages.send`. There is **one ManageOS-controlled sending account**
for the whole platform; each company is identified by name inside its
invitations. We do **not** ask company owners to grant access to their mail.

## Google setup that requires account-owner action

1. Choose an existing Gmail account or create a separate Gmail account;
   **no new account is required**. For security, avoid sharing private
   credentials in chats or commits.
2. Sign in to [Google Cloud Console](https://console.cloud.google.com/),
   create a project, and enable the **Gmail API**.
3. Configure the OAuth consent screen with only the
   `https://www.googleapis.com/auth/gmail.send` scope. This is a **sensitive**
   scope. Do not request Gmail read, delete or modify permissions.
4. Create OAuth credentials. Complete Google's consent and authorization
   flow for the sender account to obtain a refresh token using offline access.
   You must follow Google's published OAuth flow and make sure redirect URIs
   match. Keep the client secret, authorization code, access token and refresh
   token **out of chat and GitHub**.
5. In Render → ManageOS → Environment, set these as private values:
   `EMAIL_PROVIDER=gmail`,
   `GMAIL_SENDER_EMAIL` (the authorized sender),
   `GMAIL_OAUTH_CLIENT_ID`,
   `GMAIL_OAUTH_CLIENT_SECRET`,
   `GMAIL_OAUTH_REFRESH_TOKEN`, and
   `PUBLIC_APP_URL=https://manageos.onrender.com`.
   Leave unrelated services and database variables alone. **Do not set
   `EMAIL_PROVIDER=gmail` before all credentials are ready**.
6. After explicitly authorized configuration, deploy, then send a single
   invitation to a test mailbox you control. Verify it lands in the inbox,
   shows correct company, role and department, and that the recipient sees
   those verified details before creating their password. Test expiration,
   used links, retries and one password-reset email. Check inbox and spam.

**Google limitation:** For an OAuth consent screen of type *External* in
*Testing*, refresh tokens normally expire after **seven days** when requesting
Gmail scopes. Publishing status, sensitive-scope verification and account
restrictions can affect long-term use. Do not promise 24/7 commercial email
availability from this free personal Gmail arrangement. Google also imposes
sending quotas and may suspend automated use. This is an interim, low-volume
option, not a replacement for a proper domain-verified transactional sender.

## Invitation behavior and security

- Company roles are picked by authorized staff in ManageOS, not by invitees.
- Invitations contain a cryptographically random, single-use token valid for
  seven days. Only SHA-256 hashes of tokens are persisted in PostgreSQL.
- Opening `/invite?token=...` prompts the frontend to call
  `POST /api/invitations/preview` with the token in the **request body**.
  The API returns only verified company name, role name, organization unit
  name and expiry, after checking pending/unexpired status. No user email,
  password, token, secret, or other tenant details appear in preview JSON.
  The endpoint is rate limited and protected by the application's CSRF check.
- The employee sees the verified information before entering any credentials.
  Invalid, expired or already-used links cannot show the password form.
- Acceptance still independently checks and consumes the token, creates user,
  assigns the company role and organization membership in a transaction, and
  keeps normal RBAC/company isolation intact.
- Production refuses invitation creation when email delivery is unavailable.
  If an attempted send fails, the backend revokes the invitation and returns
  an error; it never silently reports a successful delivery.
- Gmail and Resend requests must never log OAuth tokens or invitation URLs.

## References
- Gmail API sending: https://developers.google.com/workspace/gmail/api/guides/sending
- OAuth server flow: https://developers.google.com/workspace/gmail/api/auth/web-server
- Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Refresh token limitations: https://developers.google.com/identity/protocols/oauth2/

**Never claim email is active merely because mocked provider tests pass.**
