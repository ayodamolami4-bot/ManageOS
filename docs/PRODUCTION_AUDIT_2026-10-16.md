# ManageOS final production audit — 2026-10-16

Status: **NOT YET APPROVED FOR REAL CUSTOMER DATA OR PAID SLA CLAIMS.**
The app is an operationally promising public beta / portfolio-grade product.
This is a review of current main + the global email identity PR, not an
independent external penetration test.

## Verified evidence

- Main SHA before audit: cf2ba10. Migration 042 was safely applied after
  backup restore; PR #8 merged as 7320812. All six PR checks passed.
- Owner registration verified by real inbox, with login blocked until
  verification and one-time confirmation enforced.
- Account email changes verified by real inbox: unverified address is denied,
  verified new address works, old address denied, old sessions revoked.
- Production Neon before migration 042: 3 companies, 10 users,
  **zero global email duplicate groups** and 41 prior migrations. Migration 042
  created the case-insensitive unique index and was recorded as applied;
  post-migration checks confirm the index and all 10 users remain.
- GitHub live smoke previously passed on Oct 16, but it predates the latest
  deployment; does NOT prove current Render configuration or live uptime.
- Existing isolated Chromium and PostgreSQL integration CI exercise company
  scope, project goals, task workflows, permissions, files, and auth.

## Confirmed release blocker: ambiguous login email

Invitations previously checked only `company_id + email`. Login queries by
email alone with LIMIT 1. A user already in Company A could be invited into
Company B and created twice; whichever database row login selected would be
ambiguous. This PR:
- Makes invitation creation and acceptance check email globally.
- Adds fail-closed sign-in and password-recovery logic for ambiguous legacy data.
- Adds migration 042 for a case-insensitive **database-enforced unique index**.
- Adds regression tests for cross-company invite, redemption race and DB index.

**Do not deploy the index without an independent restorable backup.**
A read-only production check found zero current duplicates; recheck before
migration. Current app policy is **one user belongs to one company**.
Enabling multi-company membership would require a separate identity redesign.

## Operational blockers

1. **Backup + restore** (partly resolved): A successful encrypted backup
   (run 38963022587) was decrypted and restored to disposable PostgreSQL 17
   (run 38963313832). Daily GitHub Actions backup scheduling is enabled,
   with 14-day artifact retention. Still needed: independently archived
   encrypted copies, Neon-specific restore exercise and Supabase file backups.
2. **Rollout/rollback** (high): Render Free deployments are manual.
   Migrations must be run in a controlled order on the correct Neon branch.
   Confirm Render HTTP health check targets `/api/ready`; config in
   `render.yaml` is not evidence of live settings. Ensure all smoke
   checks are re-run against each deployed commit.
3. **Monitoring/reliability** (high): Free Render sleeps/cold-starts and has
   no always-on SLA. Check real error reporting, backup failure alerts,
   provider quotas and service outage behavior; no paid upgrades approved.
4. **File security** (high): MIME/file content checks and private Supabase
   storage are present, but malware scanning and independent stored-object
   backup/restore are not fully verified.
5. **Manual QA + access review** (medium/high): Role matrix (OWNER, MANAGER,
   TEAM_LEAD, EMPLOYEE), cross-company ID tampering, 401/403, mobile,
   accessibility, timeout, deletion, and concurrency need signed-off matrix
   and real browser coverage. CI is valuable but not a replacement.
6. **Email provider** (medium): Google Apps Script is live and sent real
   invitations and verification emails. Earlier runbook statements that
   only Resend is supported are stale. Validate password reset delivery,
   bounce behavior, Gmail quota, notification at old email after change.
7. **Test maintenance**: Legacy live-auth/user-journey workflows still assume
   immediate company creation and create fake data on a production database.
   Retired in this PR. The isolated Postgres/Chromium CI continues to test
   the real workflows; read-only live smoke remains available.

## Release gates (must pass)

- [x] Encrypted Neon backup restored to a disposable PostgreSQL 17 instance.
- [ ] Encrypted copy archived off GitHub and provider-specific Neon restore drill.
- [ ] File object backup/export and readback restore from a separate location.
- [x] Migration 042 applied and recorded in production with 10 users preserved.
- [x] PR #8 merged after green CI; live Render deployment needs confirmation.
- [ ] Live Render `/api/ready` HTTP health check confirmed and live smoke re-run.
- [ ] Live invite/recover/email/session scenarios and cross-company denial.
- [ ] Error, quota and uptime alerts tested without relying on the app being awake.
- [ ] Role-by-role manual QA and file access denial + malware protection review.
- [ ] Accept Free-tier availability tradeoffs and limitations before onboarding.

No original company or file should be deleted without approval. No payment or
paid infrastructure changes should be made without consent.
