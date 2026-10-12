# ManageOS — single-origin deployment runbook

**State:** Configuration prepared; NOT deployed. The `render.yaml` blueprint is manual and uses an always-on paid web instance. Do not create a public demo before all P0 gates below pass.

## Why one origin
Express serves `/api/*` and the built React SPA from the same hostname. The browser uses `/api` by default, so HTTP-only session and CSRF cookies stay first-party. Refreshing `/app/projects/:id` serves `index.html` rather than a 404. Unknown `/api/*` paths remain JSON 404s.

Local development is unchanged: Vite proxies `/api` to the Express server on port 5000.

## Deployment configuration (not an instruction to deploy yet)
The checked-in root `render.yaml` builds both packages and starts `backend/server.js`. It selects a paid `0.5c-512mb` web-service plan to avoid free-instance sleep, disables automatic deployment, checks PostgreSQL at `/api/ready`, and runs `backend/migrate.js` in Render's pre-deploy stage.

On the Render Dashboard after the release blockers are resolved, connect the private repository, choose the Blueprint, review the billed compute plan, and provide these secrets/settings privately:

- `DATABASE_URL` — managed PostgreSQL connection string with TLS parameters (e.g. `sslmode=require`), never a local database address.
- `PUBLIC_APP_URL` — exact HTTPS service origin, e.g. `https://manageos-unique.onrender.com`. Do not include a trailing slash.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — verified sender credentials. Real delivery has not been tested.
- `NODE_ENV=production` is set by the Blueprint. Leave `FRONTEND_URL` unset for a single-origin frontend; the API derives the allowed origin from `PUBLIC_APP_URL`.
- `VITE_API_BASE_URL` is unnecessary for this deployment; the frontend defaults to `/api`.

The React build needs dev build tools even when `NODE_ENV=production`, hence the Blueprint's `npm ci --include=dev --prefix frontend`. Backend runtime dependencies are installed separately. Never commit database URLs, credentials or personal tokens.

## Release-blocker gates (P0, in order)
1. **Production bundle:** Five CI jobs pass, including the production artifact smoke test for HTML deep links and JSON API 404s.
2. **Durable file storage:** Replace local `backend/storage/files` with private persistent object storage, verify upload/download/delete, signed/private access and recovery after deploy. Existing local-disk storage is not safe on an ephemeral instance.
3. **Security:** Investigate dependency audit findings, ensure multi-instance rate limiting or a gateway policy, review session/CSRF/tenant authorization; address critical/high actionable vulnerabilities.
4. **Email:** Verify Resend domain, real invitation/password-reset delivery, bounce/failure behavior and durable retry/outbox policy.
5. **Database:** Backups + restore drill, migration dry-run on staging, rollback plan, DB connection TLS and least-privilege credentials.
6. **Operational readiness:** Health monitoring, structured logs without secrets, alerts, manual accessibility check and a signed-in role-by-role staging smoke test.
7. **Demo release:** Only after gates 1–6; use isolated seeded demonstration accounts in a separate company/tenant, set data reset policies, and upgrade any sleeping compute used for the demo.

## Cutover checks (after the gates)
- HTTPS /, /login, /app/overview (with login), /api/health, /api/ready, /api/auth/csrf.
- Refresh a protected nested URL: redirect to login when unauthenticated, keep deep link after sign-in.
- Create and review work, invite employee via real email, reset password, upload/download a file, verify tenant isolation and safe errors.
- Review health checks and logs; keep automatic deployments disabled until production migration/rollback discipline is established.

**Invariant:** Passing CI means code is test-verified, not that infrastructure, email or persistent files are production-ready.
