# Tidepath Logistics — ManageOS recruiter demo dataset

## Purpose

This is a **fictional, sample-only company** seeded into the dedicated ManageOS
Neon database on 2026-10-16. It demonstrates actual PostgreSQL-backed operations.
It is **not** a real customer or a claim that Tidepath operates a logistics company.

This environment is separate from the Marketplace project.

## Tenant

- Company name: Tidepath Logistics (Demo)
- Company ID: `b217e28e-e7fa-461a-a43b-034e9e629502`
- 7 fictional team members: owner, company-wide manager, dispatch team lead,
  and four employees across dispatch, customer success, quality and systems
- 5 organization units with a Dispatch & Fleet team under Operations

### Work and collaboration

- 4 business goals connected to projects through 8 persisted goal–project links
- 5 projects: Lagos Dispatch Command Centre, Delivery Exceptions Recovery Playbook,
  Customer ETA Notifications, Warehouse Scan Quality Pilot,
  and Rider Onboarding & Route Readiness
- 10 milestones
- 15 assigned tasks, representing completed, in-progress, submitted,
  needs-changes and assigned work
- 54 task status history records and 7 task review decisions
- 11 progress reports and 3 blockers
- 4 operational requests, 3 discussions and 6 comments
- 8 notifications, 23 activity events and 11 audit entries
- 3 real private Supabase project documents with verified stored bytes

The sample's dates are relative to the seeding date (October 2026). Update
stale dates before public portfolio launch, rather than making false claims
about continuously updated operations.

## Project evidence files

The sample project attachments are actual authenticated Supabase objects,
not fake links or unbacked database rows. Each file was uploaded, downloaded
for byte-for-byte verification, and registered with a SHA-256 checksum:

- Lagos Dispatch Command Centre — `dispatch-control-brief.txt`
- Delivery Exceptions Recovery Playbook — `exceptions-quality-review.txt`
- Customer ETA Notifications — `customer-alert-pilot-notes.txt`

## Security and operational notes

The fictional staff accounts **do not have published or known passwords**:
their Argon2id hashes were generated from an unrecoverable random secret.
No owner or administrator login is being shared with the public.

The seeded company currently exists as database fixtures; direct recruiter
login is **not yet enabled**. Do not advertise a "Try Demo" action until a
separate, restricted viewer flow is implemented and tested against the live
server. A public writable owner session would be unsafe.

Demo fixtures can be explored through ManageOS's real server-side
authorization model after safe access is available. Demo account privileges,
mutation prevention, cross-tenant isolation, and visibility across browser
and mobile should be verified before opening access to recruiters.

## Remaining release work

- Implement and end-to-end test **read-only guest/recruiter access**.
- Configure verified-domain transactional email for invitations and
  password recovery using Resend.
- Review whether demo-only users should be excluded from outbound email.
- Recheck responsive layout and cold-start behavior for the recruiter journey.
- Treat sample records and metrics as fictional in any portfolio case study.
