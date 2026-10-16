# ManageOS — release readiness

Updated October 16, 2026. This is a production-engineering checklist,
not a statement that the app is ready for paying customers.

## Built, deployed, and verified

- Multi-tenant REST backend (Express, PostgreSQL and server-side sessions),
  company creation, login/logout, session revocation, CSRF, role/permission
  checks and role-based work management.
- React authenticated workspaces: organization, people, goals, projects,
  milestones, tasks, assignments, submissions/reviews, requests, blockers,
  files, notifications, activity and permission-protected audit logs.
- Render Free web service at https://manageos.onrender.com backed by
  Neon PostgreSQL 17 and a private Supabase Storage bucket.
- 39 production migrations, independent CI including backend, frontend,
  database integration, Chromium end-to-end workflows and production bundle.
- Live browser journeys covering registration, login, team/work operations
  and authenticated private file upload/download/delete.
- Recruiter demo prototype archived on `archive/portfolio-recruiter-demo`,
  removed from the real application. Main database still holds a fictional
  company; deletion or migration needs explicit authorization.
- Independent Neon development branch (br-proud-silence-zay9822j), with
  production still on br-royal-forest-za071sdz.
- Manual Neon production snapshot `snap-bitter-cake-zacdj7a1`, created
  October 16. Free plan's short restore history remains enabled.
- Daily conditional monitoring of public homepage and database/storage
  readiness; persistent failures prompt an alert.
- PostgreSQL pool has bounded connection/query waits and idle-client
  error handling. Resend adapter has dedicated configuration validation,
  invitation idempotency and automated provider-contract tests.

## Prepared but not activated

- `.github/workflows/encrypted-backup.yml` for manual PostgreSQL 17
  encrypted logical exports. Requires independently saved
  `MANAGEOS_BACKUP_ENCRYPTION_KEY` in GitHub Actions secrets, an actual
  successful run and an isolated restore drill. No nightly backups are
  active yet, and the Supabase file objects require independent backup.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` require a verified sender
  domain and private Render environment configuration. The current user
  account has not yet supplied these values. We cannot claim invitation
  or password-reset deliverability.
- Render's live service currently uses TCP health checks, even though
  `render.yaml` declares HTTP `/api/ready`. Update Health Checks in
  the actual Render service settings.
- The development branch is separate at the database level but has no
  dedicated staging Render web service. A local test server can use its
  branch-specific connection string; keep production URLs/keys separate.

## Still required before real customers

1. Configure a verified sender domain and private Resend credentials.
   Test delivery and failure behavior in a real inbox, including
   invitations, account recovery, bounces and safe error responses.
2. Run encrypted backups, verify restoration to an isolated Neon branch,
   establish a recurring schedule, and back up Supabase objects too.
3. Complete manual security review: cross-company authorization,
   resource-permission matrix, session lifecycle, file access, tenant
   deletion and secure monitoring. Address malware scanning and
   uploaded-file content safeguards.
4. Test migrations with rollback drills against development, then apply
   production migrations only with backups and controlled deployment.
5. Configure HTTP health checks and external error/uptime monitoring;
   establish incident and rollback procedures.
6. Accessibility and load tests, mobile role journeys, manual QA.
7. Confirm acceptable cost, quotas and availability. Render Free and
   Neon Free are useful prototypes but lack production uptime SLAs.
   Never upgrade or incur charges without consent.

Refer to `docs/DEPLOYMENT_RUNBOOK.md` for operator procedures.
