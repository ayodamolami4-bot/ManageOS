# ManageOS engineering map

This guide is for reviewers who need to trace a feature without reading the
entire codebase. ManageOS is a modular Node.js/Express + React application
using PostgreSQL and server-side sessions. Domain data is in PostgreSQL, not
duplicated in browser constants, mock prefabs or multiple JSON stores.

## Where to look

| Concern | Source of truth |
|---|---|
| API entry, routes and middleware order | `backend/src/app.js` |
| URL and authorization middleware | `backend/src/routes/*Routes.js`, `backend/src/middleware/` |
| HTTP input and response conversion | `backend/src/controllers/`, `backend/src/validators/` |
| Business rules, transitions and authorization | `backend/src/services/` |
| Parameterized SQL, transactions and persistence | `backend/src/repositories/` |
| Schema and seed-role migrations | `backend/migrations/` |
| Cloud file storage | `backend/src/utils/storageProvider.js` and provider adapters |
| Environment variable reference | `backend/.env.example` |
| Frontend URL mapping and authentication gate | `frontend/src/routes/` |
| Shared HTTP/CSRF implementation | `frontend/src/services/api.js` |
| Browser session state | `frontend/src/context/AuthContext.jsx` |
| Public and private screens | `frontend/src/pages/`, `frontend/src/components/` |
| Deploy and automated checks | `render.yaml`, `.github/workflows/` |

For a change to a task, follow this trace:
`frontend/src/pages/app/Work.jsx` → `frontend/src/services/api.js`
→ `backend/src/routes/taskRoutes.js`
→ `backend/src/controllers/taskController.js`
→ `backend/src/services/taskService.js` or
`backend/src/services/taskWorkflowService.js`
→ `backend/src/repositories/taskRepository.js`
→ `backend/migrations/*tasks*.sql`.
This is separation of responsibilities, not independent hard-coded copies
of the task data.

## What is configuration vs actual data?

- Runtime secrets, service endpoints, CORS origin and storage provider belong
  in environment variables. See `backend/.env.example` for the current list.
  Real keys are not committed to GitHub or exposed to the React bundle.
- System roles, permissions and SQL constraints are defined with migrations.
  They are not editable JSON fixture arrays used as a parallel source of truth.
- Projects, organization units, people, goals, tasks, assignments, status
  history, reviews and discussions are persisted in PostgreSQL.
- Marketing-page visual previews may use illustrative copy; those mock
  illustrations must not be mistaken for a populated authenticated workspace.
- The **fictional public recruiter demo** is a special, intentionally
  restricted, read-only view over ONE sample tenant. Its tenant ID, company
  name, and three approved sample filenames are centralized in
  `backend/src/config/publicDemo.js`. Its implementation is explicitly
  separated into:
  `backend/src/routes/publicDemoRoutes.js` → 
  `backend/src/services/publicDemoService.js` → 
  `backend/src/repositories/publicDemoRepository.js`.
  It never creates a session or exposes passwords, email addresses or file
  storage keys to the public. It is NOT the application-wide tenant selector.

## Review rules for future contributions

1. One source of truth per domain record. Database records are not shadowed
   by hard-coded frontend arrays or new JSON data stores.
2. Keep SQL out of route handlers and UI components. HTTP handlers dispatch;
   repositories query; services enforce domain rules.
3. Use a specific company scope for every tenant-owned query, including joins.
4. Do not add a fake/disabled button in place of a real workflow. Show loading,
   empty, unauthorized and failed states.
5. Never expose service keys or password hashes in client-side responses.
6. Add a regression test when changing a domain workflow or access check.
7. Document intentionally fixed policy constants in a named config module.
8. Avoid automatic imports, global state and new dependencies without need.
9. Prefer clear function names and bounded files; split large components by
   responsibility rather than inventing abstraction layers unnecessarily.
10. A passing build is necessary, but the deployed journey needs browser and
    API verification too.

## Technical debt still worth reviewing

- Environment access is documented, but remains distributed across
  application startup, email and storage adapters. A single validated runtime
  configuration adapter would improve consistency and fail-fast diagnostics.
- Some large frontend pages mix state coordination and presentation.
  `DemoExplorer.jsx` is a current example; splitting its sections into
  focused components would improve maintainability.
- API routing in `backend/src/app.js` is centralized but long. Route
  registration can be grouped as the application grows.
- Public demo data and marketing illustrations must remain clearly labeled
  *fictional*. Keep reviewer sample dates and links fresh.
- The live public demo must pass GET/403/405/404 isolation tests, the
  private-user flows must remain authenticated, and release verification must
  be repeated after deployment.

These are concrete maintenance notes, not a claim that every file has
undergone a comprehensive architecture audit.
