// The only tenant and documents permitted in the unauthenticated recruiter preview.
// Keep this isolated from production authentication and general company APIs.
const DEMO_ID = "b217e28e-e7fa-461a-a43b-034e9e629502";
const DEMO_NAME = "Tidepath Logistics (Demo)";
const APPROVED_FILES = Object.freeze([
  "dispatch-control-brief.txt",
  "exceptions-quality-review.txt",
  "customer-alert-pilot-notes.txt"
]);
module.exports = { DEMO_ID, DEMO_NAME, APPROVED_FILES };
