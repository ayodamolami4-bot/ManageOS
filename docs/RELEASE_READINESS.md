# ManageOS — release readiness and unfinished work

This file is a working engineering checklist, **not** a claim that ManageOS is released.

## Shipped in the main branch before this feature
- Company creation and session-cookie authentication; RBAC with company scoping.
- Organization memberships, goal/project/task lifecycle, project leads and scoped team roles.
- Assignment/reassignment, employee submissions, review and rework, blockers/requests, activities and audit.
- Frontend API integration, PostgreSQL integration, four-role Chromium journey, validation and CI.

## In progress: account recovery and branded product completeness
- Expiring one-use hashed reset tokens and database migration 037.
- 30-minute link, 5-minute per-account throttle, IP throttle, no existence disclosure in API response.
- Email provider adapter via Resend REST; verify sender domain and secrets out of source.
- Password reset invalidates all sessions and records a company-scoped audit event.
- Replace placeholder auth forms with real POST, validation and feedback.
- Present the **actual tenant name** rather than a generic workspace string.
- Maintain unique ManageOS editorial design and clear application interaction states, not generic AI UI patterns. See DESIGN_QUALITY_STANDARD.md.

## Required before real customers
- Configure verified sending domain, HTTPS public URL, Resend API key. Test actual deliverability and recovery failure handling.
- Review rate limiting for multiple backend instances: in-memory IP rate limits must move to a distributed store or gateway.
- Production email queue/outbox and retry strategy to protect external sends from worker/network failures.
- Secure production PostgreSQL, automated migrations, backup and restore drills, migrations rollback plan.
- Durable private object storage: existing file subsystem is local filesystem and is not reliable on ephemeral cloud disks.
- Review deletion lifecycle of stored files, MIME/content validation, antivirus scanning, size limits and access controls.
- Complete tenancy and role-based authorization regression matrix, security review and external review of account/session recovery.
- Accessibility audit: keyboard navigation, contrast, mobile user flows, screen readers and reduced motion.
- Structured logs, error reporting, metrics, health endpoints, uptime alerts and rate limits.
- Stage and deploy through CI/CD; separate demo tenant and account isolation will be built **after** product completion, when the portfolio website is created.

## Release invariant
Do not claim production-ready solely from green automated tests. Merge completed features after CI/review; deploy only after the operational and security tasks are verified.
