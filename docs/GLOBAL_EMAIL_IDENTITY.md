# Global login-email identity protection

ManageOS currently assigns each user to exactly one company and signs in
using a single email address. There is no company selector at login.

**Invariant:** one email address (case-insensitive) belongs to at most one
ManageOS user globally.

Migration 042 adds a unique index on LOWER(users.email). Invitation creation
and redemption must reject already-registered emails in ANY company. Existing
company-owner registration and email-change code already check globally.

Before migration: query the intended production database for duplicate groups:
```sql
SELECT COUNT(*) AS duplicate_groups
FROM (
  SELECT LOWER(email) AS login_email
  FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1
) duplicates;
```
**Do not apply the migration if this count is nonzero.** Manually reconcile
existing conflicting accounts with user consent first; never delete them
automatically.

Run a verified independent database backup and test restore first. Then
apply migration 042 to the confirmed production Neon main database, verify
the index, merge/deploy tested code in controlled order. If Render Auto Deploy
is on, disable it BEFORE merging: deploy must follow migration, not precede it.

Long-term multi-company memberships with a single identity would require
a different data model and explicit company switching; this change preserves
ManageOS's current one-user-one-company policy.
