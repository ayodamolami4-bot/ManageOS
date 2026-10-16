// Instructional tour copy only. Domain records are fetched from the read-only API.
export const TOUR_STEPS = Object.freeze([
  {
    section: "overview",
    title: "Start with the operating picture",
    description: "Read Tidepath's current workload and open issues. These numbers come from the same PostgreSQL company records shown throughout this tour.",
    prompt: "Notice how projects, tasks and attention items connect instead of appearing as separate dashboards.",
    collection: "projects",
    collectionLabel: "projects in the sample company"
  },
  {
    section: "goals",
    title: "Trace a business objective",
    description: "Open a company goal and inspect the real project links supporting it. The links aren't decoration: they are stored relationships.",
    prompt: "Try opening a linked project. You can always resume the tour from this guide.",
    collection: "goals",
    collectionLabel: "company goals"
  },
  {
    section: "projects",
    title: "Follow a project to delivery",
    description: "Select a project to see its related objectives, milestones, tasks and supporting documents.",
    prompt: "Look for the active dispatch work and its linked milestone schedule.",
    collection: "milestones",
    collectionLabel: "project milestones"
  },
  {
    section: "work",
    title: "Inspect the complete task trail",
    description: "Tasks connect assignees and progress reports to review decisions and recorded status changes, so progress is accountable.",
    prompt: "The example opens a task with review history. Use search or filters to explore another.",
    collection: "taskHistory",
    collectionLabel: "status transitions"
  },
  {
    section: "team",
    title: "See who owns the work",
    description: "Teams, departments and scoped roles describe how responsibilities are assigned within the company.",
    prompt: "Role descriptions here are explanatory; the real application separately enforces server-side authorization.",
    collection: "people",
    collectionLabel: "fictional team members"
  },
  {
    section: "updates",
    title: "Follow blockers and conversations",
    description: "Requests, blockers and comments preserve context around the work that needs a decision or a response.",
    prompt: "Open a blocker’s linked task to see why it matters to the delivery workflow.",
    collection: "requests",
    collectionLabel: "operational requests"
  },
  {
    section: "record",
    title: "Review what changed",
    description: "The activity timeline shows meaningful events and their actors; private audit payloads are not exposed to public visitors.",
    prompt: "This is an intentionally limited view, not permission to inspect a real customer’s audit log.",
    collection: "activity",
    collectionLabel: "sample activity events"
  },
  {
    section: "files",
    title: "Verify real project evidence",
    description: "Download a sample project note. It comes from private Supabase storage through a narrow, read-only backend endpoint.",
    prompt: "Only the three explicitly approved fictional documents are downloadable; there is no public upload or edit feature.",
    collection: "files",
    collectionLabel: "approved sample documents"
  }
]);
