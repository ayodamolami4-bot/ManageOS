import { useEffect, useState } from "react";

import { get, post } from "../../services/api";
import TaskBlockersPanel from "../../components/TaskBlockersPanel";
import OperationalRequestsPanel from "../../components/OperationalRequestsPanel";
import { apiErrorMessage, apiFieldErrors } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./Updates.css";

function Updates() {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState("");
  const [reports, setReports] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportError, setReportError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ progressPercentage: "", content: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    get("/tasks")
      .then((response) => {
        if (!active) return;
        setTasks(Array.isArray(response?.data) ? response.data : []);
        setErrorMessage("");
      })
      .catch((error) => {
        if (active) setErrorMessage(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });
    return () => { active = false; };
  }, [refreshIndex]);

  useEffect(() => {
    let active = true;
    if (!taskId) return () => { active = false; };

    get("/tasks/" + taskId + "/reports")
      .then((response) => {
        if (active) setReports(Array.isArray(response?.data) ? response.data : []);
      })
      .catch((error) => {
        if (active) setReportError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });

    return () => { active = false; };
  }, [taskId, refreshIndex]);

  function validate() {
    const next = {};
    if (!tasks.some((task) => task.id === taskId)) {
      next.taskId = "Select an accessible task.";
    }
    if (!/^\d{1,3}$/.test(draft.progressPercentage) ||
        Number(draft.progressPercentage) > 100) {
      next.progressPercentage = "Enter a whole-number percentage between 0 and 100.";
    }
    if (!draft.content.trim()) {
      next.content = "Explain the progress made on this task.";
    } else if (draft.content.trim().length > 10000) {
      next.content = "Maximum 10,000 characters.";
    }
    return next;
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/tasks/" + taskId + "/reports", {
        progressPercentage: Number(draft.progressPercentage),
        content: draft.content.trim(),
      });
      if (response?.data) setReports((items) => [response.data, ...items]);
      setDraft({ progressPercentage: "", content: "" });
      setFormOpen(false);
      setMessage("Progress report posted.");
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="updates-page">
      <header className="updates-header">
        <div>
          <p className="updates-kicker">COMPANY COMMUNICATION</p>
          <h1>Updates<span> keep the company informed.</span></h1>
          <p className="updates-intro">
            Post concrete progress reports and review the written history for work you can access.
            Report blockers, request help or approvals, and follow the written history of work.
          </p>
        </div>
      </header>

      <section className="updates-stream">
        <div className="workspace-data-row">
          <div>
            <p className="updates-section-kicker">TASK PROGRESS</p>
            <h2>What changed in the work?</h2>
          </div>
          <button type="button" className="workspace-action workspace-action--secondary"
            onClick={() => { setTasksLoading(true); setReportsLoading(Boolean(taskId)); setRefreshIndex((n) => n + 1); }}>
            Refresh
          </button>
        </div>

        {tasksLoading && <p className="workspace-feedback" role="status">Loading accessible tasks...</p>}
        {!tasksLoading && errorMessage && <p className="workspace-feedback" role="alert">{errorMessage}</p>}

        {!tasksLoading && !errorMessage && (
          <>
            <div className="workspace-field">
              <label htmlFor="updates-task">Select work</label>
              <select id="updates-task" value={taskId} onChange={(event) => {
                const next = event.target.value;
                setTaskId(next);
                setReports([]);
                setReportsLoading(Boolean(next));
                setReportError("");
                setMessage("");
                setErrors({});
              }}>
                <option value="">Choose a task to view or report on</option>
                {tasks.map((task) => (
                  <option value={task.id} key={task.id}>{task.title}</option>
                ))}
              </select>
              {errors.taskId && <span className="workspace-field-error" role="alert">{errors.taskId}</span>}
            </div>

            {taskId && (
              <>
                <button type="button" className="workspace-action" onClick={() => setFormOpen((value) => !value)}>
                  {formOpen ? "Cancel" : "Post progress update"}
                </button>

                {message && <p role="status" className="workspace-feedback">{message}</p>}
                {formOpen && (
                  <form className="workspace-data-form" onSubmit={submit} noValidate>
                    <div className="workspace-field">
                      <label htmlFor="updates-percentage">Progress (%)</label>
                      <input id="updates-percentage" type="number" min="0" max="100" step="1"
                        disabled={saving} required value={draft.progressPercentage}
                        aria-invalid={Boolean(errors.progressPercentage)}
                        onChange={(event) => setDraft((current) => ({
                          ...current, progressPercentage: event.target.value
                        }))}
                      />
                      {errors.progressPercentage && <span className="workspace-field-error" role="alert">{errors.progressPercentage}</span>}
                    </div>
                    <div className="workspace-field workspace-field--wide">
                      <label htmlFor="updates-content">What has changed?</label>
                      <textarea id="updates-content" required maxLength={10000} disabled={saving}
                        value={draft.content} aria-invalid={Boolean(errors.content)}
                        onChange={(event) => setDraft((current) => ({
                          ...current, content: event.target.value
                        }))}
                      />
                      {errors.content && <span className="workspace-field-error" role="alert">{errors.content}</span>}
                    </div>
                    <div className="workspace-actions">
                      <button type="submit" className="workspace-action" disabled={saving}>
                        {saving ? "Posting..." : "Post report"}
                      </button>
                    </div>
                  </form>
                )}

                {reportsLoading && <p role="status" className="workspace-feedback">Loading progress reports...</p>}
                {!reportsLoading && reportError && <p role="alert" className="workspace-feedback">{reportError}</p>}
                {!reportsLoading && !reportError && reports.length === 0 && (
                  <p className="workspace-feedback">No progress reports for this task yet.</p>
                )}
                {!reportsLoading && !reportError && (
                  <div className="workspace-data-list">
                    {reports.map((report) => (
                      <article className="workspace-data-item" key={report.id}>
                        <div className="workspace-data-meta">
                          <span>Progress: {report.progress_percentage}%</span>
                          <span>{new Date(report.created_at).toLocaleString()}</span>
                        </div>
                        <p>{report.content}</p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {!taskId && tasks.length === 0 && <p className="workspace-feedback">No accessible tasks yet.</p>}
          </>
        )}
      </section>

      {taskId && !tasksLoading && !errorMessage && (
        <section className="updates-stream">
          <TaskBlockersPanel key={taskId} taskId={taskId} />
        </section>
      )}

      <section className="updates-stream">
        <OperationalRequestsPanel />
      </section>
    </div>
  );
}

export default Updates;
