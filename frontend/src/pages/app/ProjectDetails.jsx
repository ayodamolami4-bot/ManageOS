import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { get, post } from "../../services/api";
import { apiErrorMessage, apiFieldErrors, validDate } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./ProjectDetails.css";

function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [relatedError, setRelatedError] = useState("");
  const [newMilestoneOpen, setNewMilestoneOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", status: "PLANNED", dueDate: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      get("/projects/" + projectId),
      get("/projects/" + projectId + "/milestones"),
      get("/tasks")
    ]).then(([projectResult, milestoneResult, taskResult]) => {
      if (!active) return;

      if (projectResult.status === "fulfilled") {
        setProject(projectResult.value?.data || null);
        setErrorMessage("");
      } else {
        setErrorMessage(apiErrorMessage(projectResult.reason));
      }

      if (milestoneResult.status === "fulfilled") {
        setMilestones(Array.isArray(milestoneResult.value?.data) ? milestoneResult.value.data : []);
      } else {
        setRelatedError(apiErrorMessage(milestoneResult.reason));
      }

      if (taskResult.status === "fulfilled") {
        setTasks((Array.isArray(taskResult.value?.data) ? taskResult.value.data : [])
          .filter((task) => task.project_id === projectId));
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function createMilestone(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!draft.name.trim()) nextErrors.name = "Milestone name is required.";
    else if (draft.name.trim().length > 255) nextErrors.name = "Name is too long.";
    if (draft.description.length > 10000) nextErrors.description = "Description is too long.";
    if (!["PLANNED", "IN_PROGRESS", "COMPLETED"].includes(draft.status)) {
      nextErrors.status = "Choose a valid status.";
    }
    if (draft.dueDate && !validDate(draft.dueDate)) {
      nextErrors.dueDate = "Enter a valid calendar date.";
    }

    setErrors(nextErrors);
    setNotice("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/projects/" + projectId + "/milestones", {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        status: draft.status,
        dueDate: draft.dueDate || null
      });
      if (response?.data) {
        setMilestones((current) => [response.data, ...current]);
      }
      setDraft({ name: "", description: "", status: "PLANNED", dueDate: "" });
      setNewMilestoneOpen(false);
      setNotice("Milestone created.");
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setNotice(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="project-details-page">
      <header className="project-details-header">
        <div className="project-details-breadcrumb">
          <Link to="/app/projects">Projects</Link>
          <span>/</span>
          <span>Project details</span>
        </div>

        {loading && <p className="workspace-feedback" role="status">Loading project...</p>}
        {!loading && errorMessage && <p className="workspace-feedback" role="alert">{errorMessage}</p>}
        {!loading && project && (
          <div className="project-details-heading">
            <div>
              <p className="project-details-kicker">PROJECT</p>
              <h1>{project.name}</h1>
              <p className="project-details-intro">
                {project.description || "No project description has been added."}
              </p>
              <div className="workspace-data-meta">
                <span>Status: {project.status?.replaceAll("_", " ")}</span>
                <span>Priority: {project.priority}</span>
                {project.start_date && <span>Started: {project.start_date.slice(0, 10)}</span>}
                {project.due_date && <span>Due: {project.due_date.slice(0, 10)}</span>}
              </div>
            </div>
            <span className="project-details-reference">{project.id.slice(0, 8)}</span>
          </div>
        )}
      </header>

      {project && (
        <>
          <section className="project-details-milestones">
            <div className="project-details-section-heading">
              <div>
                <p className="project-details-section-kicker">MILESTONES</p>
                <h2>Important stages of the <span>project.</span></h2>
              </div>
              <button className="workspace-action" type="button" onClick={() => setNewMilestoneOpen((open) => !open)}>
                {newMilestoneOpen ? "Cancel" : "Add milestone"}
              </button>
            </div>

            {notice && <p className="workspace-feedback" role="status">{notice}</p>}

            {newMilestoneOpen && (
              <form className="workspace-data-form" onSubmit={createMilestone} noValidate>
                <div className="workspace-field workspace-field--wide">
                  <label htmlFor="milestone-name">Milestone name</label>
                  <input id="milestone-name" required maxLength={255} value={draft.name}
                    aria-invalid={Boolean(errors.name)} disabled={saving}
                    onChange={(event) => update("name", event.target.value)}
                  />
                  {errors.name && <span className="workspace-field-error" role="alert">{errors.name}</span>}
                </div>
                <div className="workspace-field workspace-field--wide">
                  <label htmlFor="milestone-description">Description (optional)</label>
                  <textarea id="milestone-description" value={draft.description} maxLength={10000}
                    disabled={saving} onChange={(event) => update("description", event.target.value)}
                  />
                  {errors.description && <span className="workspace-field-error" role="alert">{errors.description}</span>}
                </div>
                <div className="workspace-field">
                  <label htmlFor="milestone-status">Status</label>
                  <select id="milestone-status" value={draft.status} disabled={saving}
                    onChange={(event) => update("status", event.target.value)}
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="workspace-field">
                  <label htmlFor="milestone-date">Due date (optional)</label>
                  <input id="milestone-date" type="date" value={draft.dueDate} disabled={saving}
                    aria-invalid={Boolean(errors.dueDate)}
                    onChange={(event) => update("dueDate", event.target.value)}
                  />
                  {errors.dueDate && <span className="workspace-field-error" role="alert">{errors.dueDate}</span>}
                </div>
                <div className="workspace-actions">
                  <button type="submit" className="workspace-action" disabled={saving}>
                    {saving ? "Creating..." : "Create milestone"}
                  </button>
                </div>
              </form>
            )}

            {relatedError && <p className="workspace-feedback" role="alert">{relatedError}</p>}
            {!relatedError && milestones.length === 0 && <p className="workspace-feedback">No milestones have been created yet.</p>}
            {!relatedError && (
              <div className="workspace-data-list">
                {milestones.map((milestone) => (
                  <article className="workspace-data-item" key={milestone.id}>
                    <h3>{milestone.name}</h3>
                    <div className="workspace-data-meta">
                      <span>Status: {milestone.status?.replaceAll("_", " ")}</span>
                      {milestone.due_date && <span>Due: {milestone.due_date.slice(0, 10)}</span>}
                    </div>
                    {milestone.description && <p>{milestone.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="project-details-work">
            <div className="project-details-section-heading">
              <div>
                <p className="project-details-section-kicker">PROJECT WORK</p>
                <h2>Responsibilities <span>moving the project forward.</span></h2>
              </div>
              <Link to="/app/work">Manage work</Link>
            </div>
            {tasks.length === 0 && <p className="workspace-feedback">No accessible tasks are currently linked to this project.</p>}
            <div className="workspace-data-list">
              {tasks.map((task) => (
                <article className="workspace-data-item" key={task.id}>
                  <h3>{task.title}</h3>
                  <div className="workspace-data-meta">
                    <span>Status: {task.status?.replaceAll("_", " ")}</span>
                    <span>Priority: {task.priority}</span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ProjectDetails;
