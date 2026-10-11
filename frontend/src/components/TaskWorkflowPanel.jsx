import { useEffect, useState } from "react";

import { useAuth } from "../context/useAuth";
import { get, post, put } from "../services/api";
import { apiErrorMessage, apiFieldErrors } from "../utils/validation";
import "./WorkspaceData.css";

function personName(person) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ") || person.email || "Team member";
}

export default function TaskWorkflowPanel({ task, onTaskChanged }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [members, setMembers] = useState([]);
  const [companyUsers, setCompanyUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [assignmentDraft, setAssignmentDraft] = useState({ userId: "", estimatedEffortHours: "" });
  const [memberUserId, setMemberUserId] = useState("");
  const [submissionDraft, setSubmissionDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState({ decision: "APPROVED", comment: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      const results = await Promise.allSettled([
        get("/tasks/" + task.id + "/assignments"),
        get("/tasks/" + task.id + "/submissions"),
        get("/project-relationships/" + task.project_id + "/members"),
        get("/users"),
      ]);

      if (!active) return;
      const [assignmentsResult, submissionsResult, membersResult, usersResult] = results;
      const issues = [];

      if (assignmentsResult.status === "fulfilled") {
        setAssignments(Array.isArray(assignmentsResult.value?.data) ? assignmentsResult.value.data : []);
      } else {
        issues.push("Assignments: " + apiErrorMessage(assignmentsResult.reason));
      }

      if (submissionsResult.status === "fulfilled") {
        const found = Array.isArray(submissionsResult.value?.data) ? submissionsResult.value.data : [];
        setSubmissions(found);

        if (found.length) {
          try {
            const reviewResponse = await get("/task-submissions/" + found[0].id + "/reviews");
            if (active) setReviews(Array.isArray(reviewResponse?.data) ? reviewResponse.data : []);
          } catch (reason) {
            issues.push("Reviews: " + apiErrorMessage(reason));
          }
        } else {
          setReviews([]);
        }
      } else {
        issues.push("Submissions: " + apiErrorMessage(submissionsResult.reason));
      }

      if (membersResult.status === "fulfilled") {
        setMembers(Array.isArray(membersResult.value?.data) ? membersResult.value.data : []);
      } else {
        issues.push("Project members: " + apiErrorMessage(membersResult.reason));
      }
      if (usersResult.status === "fulfilled") {
        setCompanyUsers(Array.isArray(usersResult.value?.data) ? usersResult.value.data : []);
      } else {
        setCompanyUsers(null);
      }

      if (active) {
        setError(issues.join(" · "));
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [task.id, task.project_id, refresh]);

  const active = assignments.find((assignment) => !assignment.ended_at);
  const currentAssignee = active?.user_id === user?.id;
  const latestSubmission = submissions[0];
  const memberNames = new Map([...members, ...(companyUsers || [])].map((person) => [person.id, personName(person)]));
  const availableUsers = (companyUsers || []).filter((person) => !members.some((member) => member.id === person.id));

  function reload() {
    setLoading(true);
    setRefresh((number) => number + 1);
    onTaskChanged();
  }

  async function submitAction(action, successMessage) {
    setBusy(true);
    setFieldErrors({});
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      reload();
    } catch (reason) {
      setFieldErrors(apiFieldErrors(reason));
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  function assign(event) {
    event.preventDefault();
    const errors = {};
    if (!members.some((member) => member.id === assignmentDraft.userId)) {
      errors.userId = "Choose a current project member.";
    }
    let effort = null;
    if (assignmentDraft.estimatedEffortHours !== "") {
      effort = Number(assignmentDraft.estimatedEffortHours);
      if (
        !Number.isFinite(effort) || effort < 0 || effort > 9999.99 ||
        Math.abs(Math.round(effort * 100) - effort * 100) > 0.000001
      ) {
        errors.estimatedEffortHours = "Use a number from 0 to 9999.99 with up to two decimals.";
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    submitAction(
      () => post("/tasks/" + task.id + "/assignments", {
        userId: assignmentDraft.userId,
        estimatedEffortHours: effort,
      }),
      "Task assigned and employee notified."
    );
  }

  function addMember(event) {
    event.preventDefault();
    if (!availableUsers.some((person) => person.id === memberUserId)) {
      setFieldErrors({ memberUserId: "Select a valid company member." });
      return;
    }
    submitAction(
      () => post("/project-relationships/" + task.project_id + "/members", { userId: memberUserId }),
      "Project member added. You can now assign the task."
    );
  }

  function endAssignment() {
    if (!active || !window.confirm("End this task assignment?")) return;
    submitAction(
      () => put("/task-assignments/" + active.id + "/end", {}),
      "Assignment ended."
    );
  }

  function startTask() {
    submitAction(
      () => put("/tasks/" + task.id + "/status", { newStatus: "IN_PROGRESS" }),
      "Task started."
    );
  }

  function submitWork(event) {
    event.preventDefault();
    const description = submissionDraft.trim();
    if (!description || description.length > 10000) {
      setFieldErrors({ description: "Describe your work using 1–10,000 characters." });
      return;
    }
    submitAction(
      () => post("/tasks/" + task.id + "/submissions", { description }),
      "Work submitted for review."
    );
  }

  function submitReview(event) {
    event.preventDefault();
    if (!latestSubmission || !["APPROVED", "NEEDS_CHANGES"].includes(reviewDraft.decision)) {
      setFieldErrors({ decision: "Choose a valid review decision." });
      return;
    }
    if (reviewDraft.decision === "NEEDS_CHANGES" && !reviewDraft.comment.trim()) {
      setFieldErrors({ comment: "Explain what the employee needs to change." });
      return;
    }
    if (reviewDraft.comment.length > 10000) {
      setFieldErrors({ comment: "Review comments cannot exceed 10,000 characters." });
      return;
    }
    submitAction(
      () => post("/task-submissions/" + latestSubmission.id + "/reviews", {
        decision: reviewDraft.decision,
        comment: reviewDraft.comment.trim() || null,
      }),
      reviewDraft.decision === "APPROVED" ? "Task approved and completed." : "Changes requested; the task is back in progress."
    );
  }

  const fieldError = (name) => fieldErrors[name] ? (
    <span className="workspace-field-error" role="alert">{fieldErrors[name]}</span>
  ) : null;

  return (
    <div className="task-workflow-panel">
      {loading && <p role="status" className="workspace-feedback">Loading task workflow...</p>}
      {!loading && error && <p role="alert" className="workspace-feedback">{error}</p>}
      {notice && <p role="status" className="workspace-feedback">{notice}</p>}

      {!loading && (
        <>
          <div className="workspace-data-meta">
            <span>Assignee: {active ? memberNames.get(active.user_id) || "Assigned team member" : "Unassigned"}</span>
            <span>Submissions: {submissions.length}</span>
          </div>

          {!active && companyUsers !== null && members.length > 0 && (
            <form className="workspace-data-form" onSubmit={assign} noValidate>
              <div className="workspace-field">
                <label htmlFor={"assignee-" + task.id}>Assign to project member</label>
                <select id={"assignee-" + task.id} value={assignmentDraft.userId}
                  disabled={busy} onChange={(event) => setAssignmentDraft((current) => ({
                    ...current, userId: event.target.value
                  }))}>
                  <option value="">Choose a project member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{personName(member)}</option>
                  ))}
                </select>
                {fieldError("userId")}
              </div>
              <div className="workspace-field">
                <label htmlFor={"effort-" + task.id}>Estimated hours (optional)</label>
                <input type="number" min="0" max="9999.99" step=".01"
                  id={"effort-" + task.id} value={assignmentDraft.estimatedEffortHours} disabled={busy}
                  onChange={(event) => setAssignmentDraft((current) => ({
                    ...current, estimatedEffortHours: event.target.value
                  }))}/>
                {fieldError("estimatedEffortHours")}
              </div>
              <div className="workspace-actions">
                <button className="workspace-action" type="submit" disabled={busy}>Assign task</button>
              </div>
            </form>
          )}

          {companyUsers !== null && availableUsers.length > 0 && (
            <form className="workspace-data-form" onSubmit={addMember} noValidate>
              <div className="workspace-field">
                <label htmlFor={"member-" + task.id}>Add company user to this project</label>
                <select id={"member-" + task.id} value={memberUserId} disabled={busy}
                  onChange={(event) => setMemberUserId(event.target.value)}>
                  <option value="">Choose company member</option>
                  {availableUsers.map((person) => <option key={person.id} value={person.id}>
                    {personName(person)}
                  </option>)}
                </select>
                {fieldError("memberUserId")}
              </div>
              <div className="workspace-actions">
                <button type="submit" className="workspace-action workspace-action--secondary" disabled={busy}>
                  Add project member
                </button>
              </div>
            </form>
          )}

          {active && companyUsers !== null && (
            <button type="button" className="workspace-action workspace-action--secondary"
              disabled={busy} onClick={endAssignment}>End assignment</button>
          )}

          {currentAssignee && task.status === "ASSIGNED" && (
            <div className="workspace-actions">
              <button type="button" className="workspace-action" disabled={busy} onClick={startTask}>
                Start work
              </button>
            </div>
          )}

          {currentAssignee && task.status === "IN_PROGRESS" && (
            <form className="workspace-data-form" onSubmit={submitWork} noValidate>
              <div className="workspace-field workspace-field--wide">
                <label htmlFor={"submission-" + task.id}>Describe the completed work</label>
                <textarea id={"submission-" + task.id} maxLength={10000} required
                  value={submissionDraft} disabled={busy} onChange={(event) => setSubmissionDraft(event.target.value)} />
                {fieldError("description")}
              </div>
              <div className="workspace-actions">
                <button type="submit" className="workspace-action" disabled={busy}>Submit for review</button>
              </div>
            </form>
          )}

          {latestSubmission && (
            <section className="workspace-data-list" aria-label="Submission history">
              <h4>Latest submission</h4>
              <div className="workspace-data-item">
                <p>{latestSubmission.description || "No description"}</p>
                <p className="workspace-data-meta">Submitted: {new Date(latestSubmission.submitted_at).toLocaleString()}</p>
              </div>
              {reviews.map((review) => (
                <div className="workspace-data-item" key={review.id}>
                  <strong>Review: {review.decision.replaceAll("_", " ")}</strong>
                  {review.comment && <p>{review.comment}</p>}
                </div>
              ))}
            </section>
          )}

          {task.status === "SUBMITTED" && latestSubmission && !currentAssignee && (
            <form className="workspace-data-form" onSubmit={submitReview} noValidate>
              <div className="workspace-field">
                <label htmlFor={"decision-" + task.id}>Review decision</label>
                <select id={"decision-" + task.id} value={reviewDraft.decision}
                  disabled={busy} onChange={(event) => setReviewDraft((current) => ({ ...current, decision: event.target.value }))}>
                  <option value="APPROVED">Approve</option>
                  <option value="NEEDS_CHANGES">Request changes</option>
                </select>
                {fieldError("decision")}
              </div>
              <div className="workspace-field workspace-field--wide">
                <label htmlFor={"comment-" + task.id}>Reviewer feedback {reviewDraft.decision === "NEEDS_CHANGES" ? "(required)" : "(optional)"}</label>
                <textarea id={"comment-" + task.id} maxLength={10000} disabled={busy}
                  value={reviewDraft.comment}
                  onChange={(event) => setReviewDraft((current) => ({ ...current, comment: event.target.value }))}/>
                {fieldError("comment")}
              </div>
              <div className="workspace-actions">
                <button type="submit" className="workspace-action" disabled={busy}>Record review decision</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
