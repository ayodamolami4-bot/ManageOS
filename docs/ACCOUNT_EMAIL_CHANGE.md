# Verified changes to existing ManageOS account email addresses

This change **does not** touch existing users or invalidate sessions at deploy
time. Existing profile PUT routes now reject any attempt to change an email
without verification, including requests made by a company OWNER or MANAGER.

Workflow:

1. Signed-in user opens **Account** in the workspace sidebar.
2. POST `/api/users/me/email-change`: validate new address and current password;
   reject address collisions; save 1-hour pending token digest.
3. The new address receives a one-time confirmation link through the existing
   configured Google Apps Script email provider.
4. POST `/api/auth/confirm-email-change` verifies the token and current
   persisted email, updates the login address and audit history in one database
   transaction, revokes all account sessions and outstanding password-reset
   tokens, consumes the confirmation token.
5. Send an informational security notice to the OLD address. If that message
   cannot be delivered, the verified change still stands; never send its secret
   token to the old address. The next login uses the new email address.
6. Wrong or expired tokens do not change either address.

The current password and bearer token must never appear in application logs or
emails to the wrong person. Email changes require user self-service. Employee
invitations and company-owner registration are separate flows.

## Production release

This change needs **migration 041** before the new backend deploys. Confirm
`pending_user_email_changes` exists in the actual production ManageOS Neon
database and the `pgmigrations` history includes
`041_pending_user_email_changes`. Never apply the demo database workflow to
a production database without confirming the target. Pause automatic Render
deployment if necessary; merge tested code, migrate, deploy, test with your own
account and a second email you control.

## Caveat

ManageOS login currently looks up a user by email without specifying a
company. Existing duplicate email accounts across companies can be ambiguous.
This change prevents introducing new collisions through an email change, but
a separate review should address already-duplicated emails.
