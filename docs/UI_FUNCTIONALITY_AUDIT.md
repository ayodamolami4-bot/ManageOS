# ManageOS — no-figurehead UI audit
Last updated: 2026-10-11

## Non-negotiable rule
A control is **real** only if it invokes an authorized backend operation or client navigation with a useful result. For mutations, it must handle validation, loading, success, failure, concurrency and role restrictions. Do not count a pretty form or a successful Vite build as functional verification.

## Inventory and evidence

| Screen | Actual operation | Evidence | Next gap to verify |
|---|---|---|---|
| Public pages (Home, Product, How It Works, Security, About, Contact, Privacy, Terms) | Linked routes; informational content is intentionally static | Routed in AppRoutes | Mobile, copy accuracy and link checks |
| Register/Login/Invite | Create company, authenticated sessions, accept one-time invitation | PostgreSQL and Chromium invitation/user journey | Deliverability through configured provider |
| Forgot/Reset Password | Send recovery request, one-use token, password update, revoke sessions | PostgreSQL and Chromium form tests in PR #3 | Real email delivery, queues and actual inbox |
| Overview | Live goals/project/tasks/unread notifications via APIs and links | API wiring audited | Cross-role screenshot, partial failure states |
| Goals | Create/edit/delete goals; real project linking and unlinking | PostgreSQL and Chromium goal->project test | Permission/empty/error-state visual review |
| Organization | Create units with hierarchy; scoped permission | PostgreSQL company Owner/scoped Manager tests | Browser unit-hierarchy and editing policy |
| People | Invite, assign roles and units, remove membership | Chromium invite and PostgreSQL role tests | Last-Owner protection in browser |
| Projects/Project Details | Create/update projects, scope people, linked goals, milestones | Chromium projects and PostgreSQL permission/relationship tests | Detailed milestone editing/status UX |
| Work | Create task, assignment/reassignment, submission, approve/rework, delete | Chromium plus PostgreSQL/concurrency tests | Negative-action UI across every scope |
| Updates | Persist reports, blockers, requests with allowed status transitions | PostgreSQL requests and blockers | Progress reports and request actions in browser |
| Discussions | Create company/project discussions and write comments | Live API wiring reviewed | Complete browser discussion/reply tests |
| Notifications | Real inbox, mark-read, follow deep links to tasks, requests, discussions, and projects | Chromium notification-to-task navigation | Verify request/discussion navigation and mark-all |
| Activity/Audit | Permission-controlled paginated database records | API wiring and PostgreSQL audit events | Browser pagination, forbidden and event-detail states |
| Files | Select project, upload, download and delete attached file | Chromium uploads/downloads/deletes PNG through real API | Authorization denial tests and durable cloud storage |

## Recently closed figurehead issues
- Static password recovery forms -> working backend and interactive forms.
- Generic placeholder company identity -> real tenant/company name.
- Employee operational requests without recipient choices -> minimal company-scoped recipient endpoint.
- Notifications showing event details but not linking to related work -> safe, resource-aware deep links.
- Files upload and download not validated in browser -> complete Chromium file lifecycle test.
- Goals promised connection to projects without saved relationship -> migration 038 and bidirectional UI.
- Employee saw task/assignment/leadership mutation controls that backend would reject -> per-resource capability checks and UI restrictions.
- Scoped Manager could create any organization unit -> company-wide authorization guard and regression test.

## Remaining release blockers
No claim of “every UI workflow is fully verified” until all rows above are exercised under Owner, company-wide Manager, scoped Manager, Team Lead, Employee and unauthorized sessions on desktop and 390px mobile.

Real cloud object storage, production email delivery, distributed rate limits, staging/live infrastructure, backups, accessible keyboard flows, full regression suite and operational monitoring are still required. These are not simulated with placeholder buttons.

## Regression policy
When adding a visible user action, the PR must include a backend permission check, input validation, error treatment, real UI feedback, and at least one failing-path test. Prefer browser-level user journeys for controls that span several APIs.
