# ManageOS — live operations and release runbook

**Updated:** October 16, 2026
**Status:** The application is publicly deployed and its core journeys have
passed live API and browser checks. **It is not yet approved for real customer
onboarding or guaranteed availability.**

## Current production

- **URL:** https://manageos.onrender.com
- **Application:** React SPA and Express REST API served from the same origin.
  Frontend uses relative `/api`; server-side PostgreSQL sessions and
  first-party HTTP-only cookies remain the production authentication model.
- **Hosting:** Render web service `manageos`, region Frankfurt, **Free** plan,
  manual deployments. Do not upgrade to paid or enable automatic deployments
  without explicit authorization.
- **Database:** Neon project `manageos` (winter-fire-47036404), **main** branch
  (`br-royal-forest-za071sdz`), PostgreSQL 17. All 39 migrations applied.
- **File storage:** Private Supabase `manageos-files` bucket, server-side
  provider credentials only. Uploaded file metadata and deletion retries live
  in PostgreSQL. Local upload folders are never used in production.
- **Development database:** Independent Neon `development` branch
  (`br-proud-silence-zay9822j`). Created October 16 from the main branch.
  It has all 39 migrations but is **not** connected to the live Render
  service. It initially contains a copy of the fictional Tidepath test data;
  never use real customer personal data as development fixtures.
- **Recovery:** Neon Free includes a short restore history (the project's
  configuration reports six hours). Manual snapshot
  `snap-bitter-cake-zacdj7a1` created October 16 on the production branch
  (`ManageOS production baseline - 2026-10-16`).
  **Daily encrypted logical backups are active in GitHub Actions** (artifact
  retention 14 days). One export from October 16 was fully restored to a
  disposable PostgreSQL 17 database; Neon-specific restoration and off-GitHub
  archival still require an exercise.
- **Monitoring:** A ChatGPT daily conditional health watch checks
  `/api/ready` and the homepage, allowing for Render Free cold starts;
  it notifies only for persistent failures. Independent GitHub production
  smoke checks are also available.
- **Portfolio recruiter demo:** Removed from production. Source is archived
  on the `archive/portfolio-recruiter-demo` GitHub branch; demo functionality
  must only be built into the separate portfolio project. The fictional
  Tidepath tenant currently remains in the production database without
  a public entry point; remove or migrate it before real customer onboarding
  with explicit deletion approval.

## Production release process

1. Merge only reviewed changes with green CI: backend tests, frontend
   lint/build, PostgreSQL integration, Chromium E2E and artifact verification.
2. Develop and test schema changes against the **development** database branch
   first, using its own privately obtained Neon connection string.
3. Create a fresh, independently restorable encrypted backup BEFORE applying
   production schema migrations. Confirm the encryption key can be recovered
   without access to GitHub. GitHub Actions should not retain raw SQL dumps.
4. Apply migrations through the existing controlled GitHub migration workflow.
   Verify the configured connection string points at the intended branch
   before using it. Never apply migrations automatically at process startup.
5. Trigger an approved manual Render deployment, and wait until its commit
   is live. Check `GET /api/ready` returns `status=ok`,
   `database=connected`, `storage=configured`. Also test `/`,
   `/login`, registration/authentication, tenant isolation, a real
   upload/download/delete, and the private workspace.
6. On failure: stop rollout, inspect structured/error logs for the failed
   deployment and revert to the previous working Render deployment when
   compatible with the current schema. Database migration rollbacks need
   explicit verification; a code rollback alone cannot undo a migration.

## Readiness checks and expected behavior

- `/api/health`: process liveness; **not a database readiness guarantee**.
- `/api/db-test`: PostgreSQL connection test; avoid publishing diagnostics
  or secrets.
- `/api/ready`: PostgreSQL connectivity and production storage configuration;
  503 when unavailable. Render health check path should be set manually in
  the actual service's **Settings → Health Checks** to `/api/ready`.
  Note: `render.yaml` defines it, but the current manually created service
  has an empty HTTP health check setting (TCP-only checks).
- `/api/auth/me`: HTTP 401 without a valid session; unknown demo API is 404.
- Free Render can idle after approximately 15 minutes and take about a minute
  to cold-start. This is **not** a production uptime guarantee. Do not claim
  paid-tier SLA, durable on-instance storage or zero-downtime always-on service.

## Encrypted PostgreSQL backups — daily schedule active

Workflow: `.github/workflows/encrypted-backup.yml`.
It is scheduled daily at 03:31 UTC and also supports manual execution.
A successful encrypted backup (run 38963022587) and isolated PostgreSQL 17
restore (run 38963313832) were verified on October 16, 2026.

1. On your own trusted computer, generate a **random 32-byte key** in
   PowerShell (do not paste the result into ChatGPT):
   ```powershell
   $bytes = New-Object byte[] 32
   [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
   [Convert]::ToHexString($bytes).ToLowerInvariant()
   ```
2. Store that same key in a password manager **outside GitHub**, with
   offline recovery. An encrypted database dump is useless if the key
   cannot be recovered.
3. In the private ManageOS repository, create GitHub Actions secret
   `MANAGEOS_BACKUP_ENCRYPTION_KEY` containing the exact 64 hex characters.
   Reuse existing `MANAGEOS_DEMO_DATABASE_URL` only because it currently
   connects to this project's live Neon main database. Rename the secret
   deliberately later to `MANAGEOS_PRODUCTION_DATABASE_URL` after updating
   all dependent workflows; don't silently replace it.
4. Actions → **Encrypted production database backup** → Run workflow.
   The runner uses PostgreSQL 17 `pg_dump --format=custom`, validates
   `pg_restore --list`, encrypts with authenticated AES-256-GCM, verifies
   decryption and uploads **only the encrypted artifact**, retained 14 days.
   The unencrypted dump is removed from the ephemeral runner.
5. Download the encrypted artifact to a trusted machine and verify the
   decrypt command can recover a PostgreSQL custom dump. Never upload the
   plaintext to public GitHub artifacts or commit it to the repository:
   ```powershell
   $env:MANAGEOS_BACKUP_ENCRYPTION_KEY = Read-Host "Backup key"
   node backend/scripts/backupCrypto.js decrypt production.dump.enc restored.dump
   Remove-Item Env:MANAGEOS_BACKUP_ENCRYPTION_KEY
   ```
6. An isolated disposable PostgreSQL 17 restore already succeeded. For a
   provider-specific disaster-recovery drill, restore to a **new isolated Neon
   test branch**, verify records and links, and never overwrite production.
   GitHub artifacts expire after 14 days; store encrypted copies separately
   for longer-term retention and monitor scheduled-run failures.

**Separate concern:** This database export does not back up the bytes in the
private Supabase bucket, only PostgreSQL file references. Plan independent
storage-object backup/restore before onboarding real customers.

## Email — Google Apps Script active; additional end-to-end QA pending

- The backend's Resend adapter sends invitations and one-time password reset
  links. Reset tokens are hashed, expire after 30 minutes, have per-account
  cooldowns, and revoke existing sessions on password change.
- Production currently uses the **Google Apps Script email adapter**, not
  necessarily Resend. Company registration verification and authenticated
  email-change confirmation succeeded in real mailboxes. Keep Apps Script
  deployment credentials private in Render and enforce Google quota limits.
  Resend remains an optional adapter requiring a verified sender domain.
- Configure email provider credentials privately under
  Render → ManageOS → Environment. Keep sender settings out of Vite build
  variables and frontend JavaScript.
- Test a real invitation from an authorized owner to a real inbox, the
  invitation acceptance flow, password recovery, token expiration, resend
  throttling, and undeliverable/bounced mail. Test without revealing
  whether an email is registered.
- Provider success is not the same as mailbox delivery. Durable outbox/retry,
  bounce handling and operational alerts are not yet complete.

## Hard requirements before accepting live customer data

- Verified delivery for all account flows, including invites and recovery.
- Independent recurring encrypted backup and successful restore drill;
  backups of Supabase objects as well as Neon database records.
- Security review for tenant/function/object authorization and sessions.
- Robust telemetry and alerts, independent error tracking, incident response.
- Confirm expected Render/Neon Free plan downtime and rate/usage limits.
  Upgrade only with explicit budget approval if customer availability requires it.
- Accessibility and user acceptance tests across roles and devices.
