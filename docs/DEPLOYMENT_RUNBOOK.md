# ManageOS — single-origin deployment runbook

**State:** Configuration prepared; NOT deployed. The `render.yaml` blueprint uses Render's **Free** web plan. There is no paid Render requirement. Free hosting sleeps when idle; this is acceptable for a carefully presented portfolio demo but is **not** customer-grade availability. Do not expose real customer data until all production gates pass.

## Why one origin
Express serves `/api/*` and the built React SPA from the same hostname. The browser uses `/api` by default, so HTTP-only session and CSRF cookies stay first-party. Refreshing `/app/projects/:id` serves `index.html` rather than a 404. Unknown `/api/*` paths remain JSON 404s.

Local development is unchanged: Vite proxies `/api` to the Express server on port 5000.

## Deployment configuration (not an instruction to deploy yet)
The checked-in root `render.yaml` builds both packages and starts `backend/server.js`. It selects Render's `free` web-service plan (no subscription), disables automatic deployment and checks PostgreSQL at `/api/ready`. Free web services suspend after approximately 15 minutes of inactivity and may take about one minute to wake up. They have an ephemeral filesystem: document uploads **must** be in private persistent storage, not local files.

Render's pre-deploy migration command is available only on paid web services. Our free-plan strategy is a separately authorized, manually triggered GitHub Actions migration workflow, run against an isolated demo database before each approved deployment. Never run migrations from the Render startup command on every wake-up.

On the Render Dashboard after the release blockers are resolved, connect the private repository, choose the Blueprint, verify the service is marked **Free** (not paid), and provide these secrets/settings privately:

- `DATABASE_URL` — managed PostgreSQL connection string with TLS parameters (e.g. `sslmode=require`), never a local database address.
- `PUBLIC_APP_URL` — exact HTTPS service origin, e.g. `https://manageos-unique.onrender.com`. Do not include a trailing slash.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — verified sender credentials. Real delivery has not been tested.
- `FILE_STORAGE_BACKEND=supabase` — private durable object storage; production rejects ephemeral local storage.
- `SUPABASE_URL` — project API URL (`https://<project-ref>.supabase.co`).
- `SUPABASE_STORAGE_BUCKET=manageos-files` — existing **private** bucket name.
- `SUPABASE_SECRET_KEY` — Supabase server-only `sb_secret_...` API key, never exposed to the browser, frontend Vite variables or commits. Unlike publishable keys, secret keys bypass Storage RLS. ManageOS's backend performs all company/project permission checks first.
- `NODE_ENV=production` is set by the Blueprint. Leave `FRONTEND_URL` unset for a single-origin frontend; the API derives the allowed origin from `PUBLIC_APP_URL`.
- `VITE_API_BASE_URL` is unnecessary for this deployment; the frontend defaults to `/api`.

The React build needs dev build tools even when `NODE_ENV=production`, hence the Blueprint's `npm ci --include=dev --prefix frontend`. Backend runtime dependencies are installed separately. Never commit database URLs, credentials or personal tokens.

## Release-blocker gates (P0, in order)
1. **Production bundle:** Five CI jobs pass, including the production artifact smoke test for HTML deep links and JSON API 404s.
2. **Durable file storage:** A private Supabase Storage adapter now supports authenticated server-side upload/download/delete (10 MB max), with local storage limited to development/test. The existing PostgreSQL authorization checks still gate file access. Migration 039 and the daily cleanup workflow retain and retry physical deletions after provider failures. A **real provider verification** and Render redeploy test are still required before production: run the manual `Verify private ManageOS Supabase Storage` workflow after adding GitHub secrets. Do not make the bucket public.
3. **Security:** The October 12 backend advisories for proxy-addr and brace-expansion were patched and CI now enforces high/critical production audits. Complete a separate authorization/session security review, prevent excessive free-tier traffic, and revisit distributed rate limiting before multi-instance production use.
4. **Email:** Verify Resend domain, real invitation/password-reset delivery, bounce/failure behavior and durable retry/outbox policy.
5. **Database:** Backups + restore drill, migration dry-run on staging, rollback plan, DB connection TLS and least-privilege credentials.
6. **Operational readiness:** Health monitoring, structured logs without secrets, alerts, manual accessibility check and a signed-in role-by-role staging smoke test.
7. **Demo release:** Only after gates 1–6; use isolated seeded demonstration accounts in a separate company/tenant and set data reset policies. Keep Render on the free plan. The future portfolio website itself should live on free static hosting (e.g. Cloudflare Pages) and provide instant case-study screenshots/video while the live demo wakes. Do not pretend the free live backend is always-on.

## Zero-cost recruiter experience
- **Portfolio landing page:** Free static hosting, so the recruiter sees the problem, architecture, engineering evidence, screenshots and a short walkthrough instantly. No paid service required to view your work.
- **Live demo:** The optional Render Free demo is launched separately, with clear startup messaging and an honest retry mechanism. It may need about a minute after idle; never imply otherwise.
- **Database:** Prefer free, managed PostgreSQL with usage limits and backup/export discipline; avoid Render Free Postgres for long-lived portfolios because its free databases expire after 30 days.
- **Storage:** Supabase Storage Free includes a limited storage quota and can pause inactive free projects. The private `manageos-files` bucket has been created in the user account; no real object verification has yet been performed. Monitor quotas from the dashboard and do not enable Pro or overage spending.
- **No unintended charges:** Do not enable a paid plan, create billed resources or sync a Blueprint before reviewing every service plan. If a payment method is present, monitor quota/overages.

## Cutover checks (after the gates)
- HTTPS /, /login, /app/overview (with login), /api/health, /api/ready, /api/auth/csrf.
- Refresh a protected nested URL: redirect to login when unauthenticated, keep deep link after sign-in.
- Create and review work, invite employee via real email, reset password, upload/download a file, verify tenant isolation and safe errors.
- Review health checks and logs; keep automatic deployments disabled until production migration/rollback discipline is established.

## Connect the existing private Supabase Storage bucket

1. In Supabase, open the ManageOS project and confirm **Storage → manageos-files** remains marked **Private**.
2. Open **Project Settings → API Keys** (or the project's **Connect** dialog). Find the **Secret keys** section. Create or reveal a new **server-side secret key** beginning with `sb_secret_`. Do **not** use the publishable/anon key and do **not** paste the secret in a chat, pull request, screenshot or frontend configuration.
3. In the GitHub ManageOS repository, open **Settings → Secrets and variables → Actions** and configure `MANAGEOS_SUPABASE_URL` and `MANAGEOS_SUPABASE_SECRET_KEY`. The project URL is not confidential but the secret key is. These secret settings should be created on the default branch for manual workflow dispatch; do not put secrets in repository files.
4. After this PR is reviewed/merged (and the manual workflow is available), run **Actions → Verify private ManageOS Supabase Storage → Run workflow**. It creates a random small text file inside the private bucket, reads and deletes it, and confirms its absence.
5. Later, when we set up Render Free, configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as Render *secret environment variables*. The Render Blueprint sets `FILE_STORAGE_BACKEND=supabase` and bucket `manageos-files`.
6. The periodic cleanup workflow also needs `MANAGEOS_DEMO_DATABASE_URL` to reconnect to the existing ManageOS PostgreSQL database. This is separate from Supabase Storage; there is no reason to move the ManageOS database to Supabase.

**Invariant:** Passing CI proves code-level behavior, not actual provider connectivity. The Supabase Storage adapter is covered by mocked HTTP contract tests. Live upload/download/delete, private-bucket enforcement, file persistence after Render restarts, error handling and actual resource quotas must be verified before a real customer release. A transactionally written PostgreSQL cleanup outbox with retry handles failures in object deletion. Failed uploads whose rollback also fails still require operational reconciliation.
