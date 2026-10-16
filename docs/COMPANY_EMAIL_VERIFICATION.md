# ManageOS company-owner email verification

## Security rule

**A submitted registration is not an active account.** The POST to
`/api/auth/register/company` returns **202 Accepted** and stores a short-lived
pending registration with a hashed password and a **SHA-256 hash of a one-time
verification token**. It does not create a `companies`, `users`, or
`user_roles` row. A verification email is sent through the already-configured
email provider (currently Google Apps Script).

The link points to `/verify-email?token=...` on ManageOS. The confirmation page
requires the visitor to click **Verify email and activate company**, so automated
email-link previews do not silently create accounts.

The `POST /api/auth/verify-company` endpoint, with `{ "token": "..." }` in the
request body, checks the pending request under a PostgreSQL transaction, creates
company + user + OWNER role, and consumes the token **atomically**.
Login before activation returns 401 because no account exists.

- 24-hour verification window; resent links invalidate older requests.
- Maximum one request to the same email per two minutes, plus IP rate limits.
- The provider must be configured before a production registration begins.
- Failure to deliver email removes the pending token; never claims activation.
- Bad, expired, and consumed links cannot activate a company.
- Hashes of tokens are persisted; raw tokens never appear in production
  registration responses or server logs.
- Test-only token exposure is limited to `NODE_ENV=test` for isolated automated
  testing with fictitious `.test` addresses, and is never enabled in production.
- Existing company accounts, invitations and current sessions are untouched.

## Production rollout order (important)

**Migration 040 is REQUIRED before deploying the code.** Otherwise the live
registration endpoint will fail due to a missing table.

1. Merge the tested PR once all GitHub CI checks pass.
2. Use the existing manual GitHub migration workflow (or the production
   migration mechanism) to apply `040_pending_company_registrations.sql`
   to the correct Neon database. Verify the migration succeeded.
3. Only after successful migration deploy the updated ManageOS backend/frontend
   on Render. Do not delete or overwrite the existing Neon data.
4. Verify genuine email signup, spam-folder delivery, 202 response, denial of
   login before verification, successful activation, login, link reuse denial,
   and expiration.
5. Check App Script daily recipient quota if signup email delivery fails.

## Existing account note

Older company accounts predate mandatory email verification. This change does
not invalidate them or silently claim their email addresses are verified.
Email-address changes made from the account profile should also require
verification; that is a separate security review item.
