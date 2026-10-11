import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { del, get, post, put } from "../services/api";
import {
  GOAL_STATUSES,
  PROJECT_STATUSES,
  PRIORITIES,
  apiErrorMessage,
  apiFieldErrors,
  toWorkPayload,
  validateWorkDraft,
} from "../utils/validation";
import "./WorkspaceData.css";

function emptyDraft(kind) {
  return {
    [kind === "goal" ? "title" : "name"]: "",
    description: "",
    status: "PLANNED",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
  };
}

function draftFromRecord(record, kind) {
  if (!record) return emptyDraft(kind);

  return {
    [kind === "goal" ? "title" : "name"]:
      kind === "goal" ? record.title : record.name,
    description: record.description || "",
    status: record.status,
    priority: record.priority,
    startDate: record.start_date ? record.start_date.slice(0, 10) : "",
    dueDate: record.due_date ? record.due_date.slice(0, 10) : "",
  };
}

function RecordEditor({ kind, record, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => draftFromRecord(record, kind));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleKey = kind === "goal" ? "title" : "name";
  const titleLabel = kind === "goal" ? "Goal title" : "Project name";
  const statusOptions = kind === "goal" ? GOAL_STATUSES : PROJECT_STATUSES;

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateWorkDraft(draft, { kind });
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length) return;

    setSaving(true);

    try {
      await onSave(toWorkPayload(draft, { kind }), record?.id);
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setServerError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function textField(field, label, type = "text", wide = false) {
    return (
      <div className={"workspace-field" + (wide ? " workspace-field--wide" : "")}>
        <label htmlFor={"work-" + field}>{label}</label>
        <input
          id={"work-" + field}
          type={type}
          value={draft[field]}
          onChange={(event) => update(field, event.target.value)}
          aria-invalid={Boolean(errors[field])}
          aria-describedby={errors[field] ? "work-" + field + "-error" : undefined}
          maxLength={field === titleKey ? 255 : undefined}
          required={field === titleKey}
          disabled={saving}
        />
        {errors[field] && (
          <span id={"work-" + field + "-error"} className="workspace-field-error" role="alert">
            {errors[field]}
          </span>
        )}
      </div>
    );
  }

  return (
    <form className="workspace-data-form" onSubmit={submit} noValidate>
      {textField(titleKey, titleLabel, "text", true)}

      <div className="workspace-field workspace-field--wide">
        <label htmlFor="work-description">Description (optional)</label>
        <textarea
          id="work-description"
          maxLength={10000}
          value={draft.description}
          onChange={(event) => update("description", event.target.value)}
          aria-invalid={Boolean(errors.description)}
          disabled={saving}
        />
        {errors.description && <span role="alert" className="workspace-field-error">{errors.description}</span>}
      </div>

      <div className="workspace-field">
        <label htmlFor="work-status">Status</label>
        <select
          id="work-status"
          value={draft.status}
          onChange={(event) => update("status", event.target.value)}
          disabled={saving}
        >
          {statusOptions.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
        {errors.status && <span className="workspace-field-error" role="alert">{errors.status}</span>}
      </div>

      <div className="workspace-field">
        <label htmlFor="work-priority">Priority</label>
        <select
          id="work-priority"
          value={draft.priority}
          onChange={(event) => update("priority", event.target.value)}
          disabled={saving}
        >
          {PRIORITIES.map((value) => <option key={value}>{value}</option>)}
        </select>
        {errors.priority && <span className="workspace-field-error" role="alert">{errors.priority}</span>}
      </div>

      {textField("startDate", "Start date (optional)", "date")}
      {textField("dueDate", "Due date (optional)", "date")}

      {serverError && <p className="workspace-feedback workspace-field--wide" role="alert">{serverError}</p>}

      <div className="workspace-actions">
        <button className="workspace-action" type="submit" disabled={saving}>
          {saving ? "Saving..." : record ? "Save changes" : kind === "goal" ? "Create goal" : "Create project"}
        </button>
        <button className="workspace-action workspace-action--secondary" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function WorkRecordManager({ kind }) {
  const resource = kind === "goal" ? "goals" : "projects";
  const singular = kind === "goal" ? "goal" : "project";
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;
    get("/" + resource)
      .then((response) => {
        if (active) {
          setRecords(Array.isArray(response?.data) ? response.data : []);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resource, refreshKey]);

  function refresh() {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  async function save(payload, id) {
    const result = id
      ? await put("/" + resource + "/" + id, payload)
      : await post("/" + resource, payload);
    const updated = result?.data;

    if (updated) {
      setRecords((existing) =>
        id
          ? existing.map((item) => item.id === id ? updated : item)
          : [updated, ...existing]
      );
    } else {
      refresh();
    }

    setEditing(null);
    setFormOpen(false);
    setMessage(id ? "Changes saved." : "Created successfully.");
  }

  async function remove(record) {
    if (!window.confirm("Permanently delete this goal?")) return;
    setDeletingId(record.id);
    setMessage("");

    try {
      await del("/goals/" + record.id);
      setRecords((existing) => existing.filter((item) => item.id !== record.id));
      setMessage("Goal deleted.");
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(record = null) {
    setEditing(record);
    setFormOpen(true);
    setMessage("");
  }

  return (
    <section className="workspace-record-manager" aria-label={resource + " register"}>
      <div className="workspace-data-row">
        <div>
          <h2>{kind === "goal" ? "Company goals" : "Project register"}</h2>
          <p className="workspace-data-meta workspace-data-count">
            {isLoading ? "Loading..." : String(records.length) + " " + resource}
          </p>
        </div>
        {!formOpen && (
          <button type="button" className="workspace-action" onClick={() => startEdit()}>
            Create {singular}
          </button>
        )}
      </div>

      {message && <p className="workspace-feedback workspace-feedback--success" role="status">{message}</p>}

      {formOpen && (
        <RecordEditor
          key={editing?.id || "new"}
          kind={kind}
          record={editing}
          onSave={save}
          onCancel={() => { setEditing(null); setFormOpen(false); }}
        />
      )}

      {isLoading && <p className="workspace-feedback" role="status">Loading {resource}...</p>}
      {!isLoading && loadError && (
        <div className="workspace-feedback" role="alert">
          {loadError}{" "}
          <button className="workspace-action workspace-action--secondary" type="button" onClick={refresh}>
            Retry
          </button>
        </div>
      )}
      {!isLoading && !loadError && records.length === 0 && (
        <p className="workspace-feedback">No {resource} have been created yet.</p>
      )}

      {!isLoading && !loadError && (
        <div className="workspace-data-list">
          {records.map((record) => (
            <article className="workspace-data-item" key={record.id}>
              <div className="workspace-data-row">
                <div>
                  {kind === "project" ? (
                    <h3><Link to={"/app/projects/" + record.id}>{record.name}</Link></h3>
                  ) : (
                    <h3>{record.title}</h3>
                  )}
                  <div className="workspace-data-meta">
                    <span>Status: {record.status?.replaceAll("_", " ")}</span>
                    <span>Priority: {record.priority}</span>
                    {record.due_date && <span>Due: {record.due_date.slice(0, 10)}</span>}
                  </div>
                  {record.description && <p>{record.description}</p>}
                </div>
                <div className="workspace-actions">
                  <button type="button" className="workspace-action workspace-action--secondary" onClick={() => startEdit(record)}>
                    Edit
                  </button>
                  {kind === "goal" && (
                    <button
                      type="button"
                      className="workspace-action workspace-action--secondary"
                      disabled={deletingId === record.id}
                      onClick={() => remove(record)}
                    >
                      {deletingId === record.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
