import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { del, get, post } from "../../services/api";
import TaskWorkflowPanel from "../../components/TaskWorkflowPanel";
import {
  PRIORITIES,
  apiErrorMessage,
  apiFieldErrors,
  validateTaskDraft,
} from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./Work.css";

const blank = {
  projectId: "",
  milestoneId: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
};

function Work() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.allSettled([get("/tasks"), get("/projects")])
      .then(([taskResult, projectResult]) => {
        if (!active) return;

        if (taskResult.status === "fulfilled") {
          setTasks(Array.isArray(taskResult.value?.data) ? taskResult.value.data : []);
          setLoadError("");
        } else {
          setLoadError(apiErrorMessage(taskResult.reason));
        }

        if (projectResult.status === "fulfilled") {
          setProjects(Array.isArray(projectResult.value?.data) ? projectResult.value.data : []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadIndex]);

  useEffect(() => {
    let active = true;
    if (!draft.projectId) return;

    get("/projects/" + draft.projectId + "/milestones")
      .then((response) => {
        if (active) setMilestones(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {
        if (active) setMilestones([]);
      });

    return () => {
      active = false;
    };
  }, [draft.projectId]);

  function update(field, value) {
    if (field === "projectId") {
      setMilestones([]);
      setDraft((current) => ({ ...current, projectId: value, milestoneId: "" }));
    } else {
      setDraft((current) => ({ ...current, [field]: value }));
    }
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function createTask(event) {
    event.preventDefault();
    const nextErrors = validateTaskDraft(draft, projects, milestones);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/tasks", {
        projectId: draft.projectId,
        milestoneId: draft.milestoneId || null,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
      });

      if (response?.data) {
        setTasks((current) => [response.data, ...current]);
      }
      setDraft(blank);
      setFormOpen(false);
      setMessage("Task created.");
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm("Delete this task permanently?")) return;
    setBusyTaskId(task.id);
    setMessage("");
    try {
      await del("/tasks/" + task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setMessage("Task deleted.");
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setBusyTaskId(null);
    }
  }

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  function errorFor(field) {
    return errors[field] ? (
      <span className="workspace-field-error" role="alert">{errors[field]}</span>
    ) : null;
  }

  return (
    <div className="work-page">
      <header className="work-header">
        <div>
          <p className="work-kicker">EXECUTION</p>
          <h1>Work<span> where responsibility becomes visible.</span></h1>
          <p className="work-intro">Track tasks, deadlines, project context and the authorized steps in each task's workflow.</p>
        </div>
      </header>

      <section className="work-state-section">
        <div className="work-section-heading">
          <div><p className="work-section-kicker">WORK STATE</p><h2>Progress across accessible work.</h2></div>
        </div>
        <div className="work-state-grid">
          {[
            ["ASSIGNED", (task) => task.status === "ASSIGNED"],
            ["IN PROGRESS", (task) => task.status === "IN_PROGRESS"],
            ["REVIEW", (task) => ["SUBMITTED", "TEAM_LEAD_REVIEW"].includes(task.status)],
            ["RESULT", (task) => ["APPROVED", "COMPLETED"].includes(task.status)],
          ].map(([label, matches]) => (
            <article className="work-state-item" key={label}>
              <span>{label}</span>
              <strong>{loading || loadError ? "—" : tasks.filter(matches).length}</strong>
              <p>Tasks in this part of the workflow.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="work-register">
        <div className="workspace-data-row">
          <div>
            <p className="work-section-kicker">WORK REGISTER</p>
            <h2>Responsibilities moving through the company.</h2>
          </div>
          <button className="workspace-action" type="button" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? "Cancel" : "Create task"}
          </button>
        </div>

        {message && <p className="workspace-feedback" role="status">{message}</p>}

        {formOpen && (
          <form className="workspace-data-form" onSubmit={createTask} noValidate>
            <div className="workspace-field">
              <label htmlFor="work-project">Project</label>
              <select id="work-project" required disabled={saving} value={draft.projectId}
                aria-invalid={Boolean(errors.projectId)}
                onChange={(event) => update("projectId", event.target.value)}
              >
                <option value="">Choose a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              {errorFor("projectId")}
            </div>

            <div className="workspace-field">
              <label htmlFor="work-milestone">Milestone (optional)</label>
              <select id="work-milestone" value={draft.milestoneId} disabled={saving || !draft.projectId}
                aria-invalid={Boolean(errors.milestoneId)}
                onChange={(event) => update("milestoneId", event.target.value)}
              >
                <option value="">No milestone</option>
                {milestones.map((milestone) => (
                  <option value={milestone.id} key={milestone.id}>{milestone.name}</option>
                ))}
              </select>
              {errorFor("milestoneId")}
            </div>

            <div className="workspace-field workspace-field--wide">
              <label htmlFor="task-title">Task title</label>
              <input id="task-title" required maxLength={255} value={draft.title} disabled={saving}
                aria-invalid={Boolean(errors.title)}
                onChange={(event) => update("title", event.target.value)}
              />
              {errorFor("title")}
            </div>

            <div className="workspace-field workspace-field--wide">
              <label htmlFor="task-description">Description (optional)</label>
              <textarea id="task-description" maxLength={10000} value={draft.description}
                disabled={saving} onChange={(event) => update("description", event.target.value)}
              />
              {errorFor("description")}
            </div>

            <div className="workspace-field">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={draft.priority} disabled={saving}
                onChange={(event) => update("priority", event.target.value)}
              >
                {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
              {errorFor("priority")}
            </div>

            <div className="workspace-field">
              <label htmlFor="task-due">Due date (optional)</label>
              <input id="task-due" type="date" value={draft.dueDate} disabled={saving}
                aria-invalid={Boolean(errors.dueDate)}
                onChange={(event) => update("dueDate", event.target.value)}
              />
              {errorFor("dueDate")}
            </div>

            <div className="workspace-actions">
              <button className="workspace-action" type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create task"}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="workspace-feedback" role="status">Loading tasks...</p>}
        {!loading && loadError && <p className="workspace-feedback" role="alert">{loadError}</p>}
        {!loading && !loadError && tasks.length === 0 && <p className="workspace-feedback">No accessible tasks yet.</p>}
        {!loading && !loadError && (
          <div className="workspace-data-list">
            {tasks.map((task) => (
              <article className="workspace-data-item" key={task.id}>
                <div className="workspace-data-row">
                  <div>
                    <h3>{task.title}</h3>
                    <div className="workspace-data-meta">
                      <span>Status: {task.status?.replaceAll("_", " ")}</span>
                      <span>Priority: {task.priority}</span>
                      {task.due_date && <span>Due: {task.due_date.slice(0, 10)}</span>}
                      <span>Project: <Link to={"/app/projects/" + task.project_id}>
                        {projectNames.get(task.project_id) || "View project"}</Link></span>
                    </div>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <div className="workspace-actions">
                    <button type="button" className="workspace-action workspace-action--secondary"
                      aria-expanded={expandedTaskId === task.id}
                      onClick={() => setExpandedTaskId((current) => current === task.id ? null : task.id)}>
                      {expandedTaskId === task.id ? "Close workflow" : "Assignment & review"}
                    </button>
                    <button className="workspace-action workspace-action--secondary" type="button"
                      disabled={busyTaskId === task.id}
                      onClick={() => deleteTask(task)}>Delete</button>
                  </div>
                </div>
                {expandedTaskId === task.id && (
                  <TaskWorkflowPanel
                    task={task}
                    onTaskChanged={() => {
                      setLoading(true);
                      setReloadIndex((count) => count + 1);
                    }}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Work;
