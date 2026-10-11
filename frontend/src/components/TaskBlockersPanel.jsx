import { useEffect, useState } from "react";
import { get, post, put } from "../services/api";
import { apiErrorMessage, apiFieldErrors } from "../utils/validation";
import "./WorkspaceData.css";

export default function TaskBlockersPanel({ taskId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    get("/tasks/" + taskId + "/blockers")
      .then((response) => {
        if (!active) return;
        setItems(Array.isArray(response?.data) ? response.data : []);
        setError("");
      })
      .catch((reason) => {
        if (active) setError(apiErrorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [taskId, refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  async function create(event) {
    event.preventDefault();
    const next = {};
    if (!title.trim()) next.title = "Blocker title is required.";
    else if (title.trim().length > 255) next.title = "Use 255 characters or fewer.";
    if (description.length > 10000) next.description = "Use 10,000 characters or fewer.";
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const response = await post("/tasks/" + taskId + "/blockers", {
        title: title.trim(),
        description: description.trim() || null,
      });
      if (response?.data) setItems((previous) => [response.data, ...previous]);
      else reload();
      setTitle("");
      setDescription("");
      setFormOpen(false);
      setNotice("Blocker recorded.");
    } catch (reason) {
      setErrors(apiFieldErrors(reason));
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function resolve(item) {
    if (!window.confirm("Mark this blocker as resolved?")) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await put("/blockers/" + item.id + "/resolve", {});
      setItems((previous) => previous.map((entry) =>
        entry.id === item.id ? response.data : entry
      ));
      setNotice("Blocker resolved.");
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Task blockers">
      <div className="workspace-data-row">
        <div>
          <h2>Blockers</h2>
          <p className="workspace-data-meta">Problems preventing this task from moving forward.</p>
        </div>
        <div className="workspace-actions">
          <button className="workspace-action workspace-action--secondary" type="button" disabled={loading} onClick={reload}>Refresh</button>
          <button className="workspace-action" type="button" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? "Cancel" : "Report blocker"}
          </button>
        </div>
      </div>

      {notice && <p className="workspace-feedback" role="status">{notice}</p>}

      {formOpen && (
        <form className="workspace-data-form" onSubmit={create} noValidate>
          <div className="workspace-field workspace-field--wide">
            <label htmlFor="blocker-title">What is blocking progress?</label>
            <input id="blocker-title" value={title} maxLength={255} required
              disabled={busy} aria-invalid={Boolean(errors.title)}
              onChange={(event) => { setTitle(event.target.value); setErrors((old) => ({ ...old, title: "" })); }}
            />
            {errors.title && <span className="workspace-field-error" role="alert">{errors.title}</span>}
          </div>
          <div className="workspace-field workspace-field--wide">
            <label htmlFor="blocker-details">Details (optional)</label>
            <textarea id="blocker-details" maxLength={10000} value={description}
              disabled={busy} aria-invalid={Boolean(errors.description)}
              onChange={(event) => setDescription(event.target.value)}
            />
            {errors.description && <span className="workspace-field-error" role="alert">{errors.description}</span>}
          </div>
          <div className="workspace-actions">
            <button className="workspace-action" type="submit" disabled={busy}>{busy ? "Saving..." : "Record blocker"}</button>
          </div>
        </form>
      )}

      {loading && <p className="workspace-feedback" role="status">Loading blockers...</p>}
      {!loading && error && <p className="workspace-feedback" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="workspace-feedback">No blockers reported for this task.</p>}
      {!loading && !error && (
        <div className="workspace-data-list">
          {items.map((item) => (
            <article className="workspace-data-item" key={item.id}>
              <div className="workspace-data-row">
                <div>
                  <h3>{item.title}</h3>
                  <div className="workspace-data-meta">
                    <span>Status: {item.status}</span>
                    <span>Reported: {new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  {item.description && <p>{item.description}</p>}
                </div>
                {item.status === "OPEN" && (
                  <button className="workspace-action workspace-action--secondary" type="button"
                    disabled={busy} onClick={() => resolve(item)}>Resolve</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
