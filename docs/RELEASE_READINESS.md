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
- 42 production migrations, independent CI including backend, frontend,
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

- `.github/workflows/encrypted-backup.yml` exports an encrypted PostgreSQL 17
  logical backup. A successful export (run 38963022587) was decrypted and
  restored to a disposable PostgreSQL 17 database (run 38963313832).
  Daily scheduled backups are enabled via GitHub Actions as of October 16;
  each artifact expires after 14 days. The user must maintain an off-GitHub
  key and durable exported copies. Supabase object bytes still need separate
  backups and a restore drill.
- Google Apps Script delivers verification and email-change messages in
  production; those two inbox journeys were verified manually. Invitations
  and password resets also use the same email adapter but their complete
  real-inbox journeys, delivery failures and provider quotas still need QA.
- Render's live service currently uses TCP health checks, even though
  `render.yaml` declares HTTP `/api/ready`. Update Health Checks in
  the actual Render service settings.
- The development branch is separate at the database level but has no
  dedicated staging Render web service. A local test server can use its
  branch-specific connection string; keep production URLs/keys separate.

## Still required before real customers

1. Complete the live email QA matrix: invitations, account recovery,
   bounces, quotas, notifications to old addresses and safe error responses.
2. Download encrypted daily backups to durable off-provider storage and
   drill restoration on an isolated Neon branch; back up Supabase objects too.
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
