import { useEffect, useState } from "react";

import { useAuth } from "../context/useAuth";
import { get, post, put } from "../services/api";
import { apiErrorMessage, apiFieldErrors } from "../utils/validation";
import "./WorkspaceData.css";

const types = ["APPROVAL", "ACCESS", "DECISION", "HELP", "OTHER"];

export default function OperationalRequestsPanel({ focusedRequestId = "" }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [recipientsError, setRecipientsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({
    assignedTo: "", type: "HELP", title: "", description: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([get("/requests"), get("/requests/recipients")])
      .then(([requestsResult, usersResult]) => {
        if (!active) return;
        if (requestsResult.status === "fulfilled") {
          setRequests(Array.isArray(requestsResult.value?.data) ? requestsResult.value.data : []);
          setLoadError("");
        } else {
          setLoadError(apiErrorMessage(requestsResult.reason));
        }
        if (usersResult.status === "fulfilled") {
          setUsers(Array.isArray(usersResult.value?.data) ? usersResult.value.data : []);
          setRecipientsError("");
        } else {
          setUsers([]);
          setRecipientsError(apiErrorMessage(usersResult.reason));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refresh]);

  function reload() {
    setLoading(true);
    setRefresh((count) => count + 1);
  }

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function create(event) {
    event.preventDefault();
    const next = {};
    if (!types.includes(draft.type)) next.type = "Choose a valid request type.";
    if (!draft.title.trim()) next.title = "A request title is required.";
    else if (draft.title.trim().length > 255) next.title = "Use 255 characters or fewer.";
    if (draft.description.length > 10000) next.description = "Use 10,000 characters or fewer.";
    if (draft.assignedTo && !users.some((candidate) => candidate.id === draft.assignedTo)) {
      next.assignedTo = "Select an existing company user.";
    }
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const response = await post("/requests", {
        assignedTo: draft.assignedTo || null,
        type: draft.type,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
      });
      if (response?.data) setRequests((current) => [response.data, ...current]);
      else reload();
      setDraft({ assignedTo: "", type: "HELP", title: "", description: "" });
      setFormOpen(false);
      setNotice("Request created.");
    } catch (reason) {
      setErrors(apiFieldErrors(reason));
      setNotice(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item, status) {
    setActiveId(item.id);
    setNotice("");
    try {
      const response = await put("/requests/" + item.id + "/status", { status });
      setRequests((previous) => previous.map((request) =>
        request.id === item.id ? response.data : request
      ));
      setNotice("Request status updated.");
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setActiveId("");
    }
  }

  const displayName = (person) =>
    [person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
    "Company member";
  const directory = new Map(users.map((person) => [person.id, displayName(person)]));

  return (
    <section aria-label="Operational requests">
      <div className="workspace-data-row">
        <div>
          <h2>Operational requests</h2>
          <p className="workspace-data-meta">Ask for approval, access, decisions or help, and track the response.</p>
        </div>
        <div className="workspace-actions">
          <button className="workspace-action workspace-action--secondary" type="button"
            disabled={loading} onClick={reload}>Refresh</button>
          <button className="workspace-action" type="button" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? "Cancel" : "New request"}
          </button>
        </div>
      </div>

      {notice && <p className="workspace-feedback" role="status">{notice}</p>}
      {recipientsError && (
        <p className="workspace-feedback" role="alert">
          Recipient directory could not load: {recipientsError}
          {" "}You can retry or create a request for yourself.
        </p>
      )}
      {!loading && !loadError && focusedRequestId &&
       !requests.some((item) => item.id === focusedRequestId) && (
        <p className="workspace-feedback" role="status">
          The linked request is no longer accessible or has been removed.
        </p>
      )}

      {formOpen && (
        <form className="workspace-data-form" onSubmit={create} noValidate>
          <div className="workspace-field">
            <label htmlFor="request-type">Request type</label>
            <select id="request-type" value={draft.type} disabled={saving}
              onChange={(event) => update("type", event.target.value)}>
              {types.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            {errors.type && <span className="workspace-field-error" role="alert">{errors.type}</span>}
          </div>

          <div className="workspace-field">
            <label htmlFor="request-assignee">Assigned to (optional)</label>
            <select id="request-assignee" value={draft.assignedTo} disabled={saving}
              aria-invalid={Boolean(errors.assignedTo)}
              onChange={(event) => update("assignedTo", event.target.value)}>
              <option value="">Unassigned — I will manage it</option>
              {users.filter((person) => person.id !== user?.id).map((person) => (
                <option key={person.id} value={person.id}>{displayName(person)}</option>
              ))}
            </select>
            {errors.assignedTo && <span className="workspace-field-error" role="alert">{errors.assignedTo}</span>}
          </div>

          <div className="workspace-field workspace-field--wide">
            <label htmlFor="request-title">Request title</label>
            <input id="request-title" value={draft.title} required maxLength={255}
              disabled={saving} aria-invalid={Boolean(errors.title)}
              onChange={(event) => update("title", event.target.value)} />
            {errors.title && <span className="workspace-field-error" role="alert">{errors.title}</span>}
          </div>
          <div className="workspace-field workspace-field--wide">
            <label htmlFor="request-description">Context and details (optional)</label>
            <textarea id="request-description" value={draft.description} maxLength={10000}
              disabled={saving} aria-invalid={Boolean(errors.description)}
              onChange={(event) => update("description", event.target.value)} />
            {errors.description && <span className="workspace-field-error" role="alert">{errors.description}</span>}
          </div>
          <div className="workspace-actions">
            <button className="workspace-action" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create request"}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="workspace-feedback" role="status">Loading requests...</p>}
      {!loading && loadError && <p className="workspace-feedback" role="alert">{loadError}</p>}
      {!loading && !loadError && requests.length === 0 && (
        <p className="workspace-feedback">No requests assigned to or created by you yet.</p>
      )}

      {!loading && !loadError && (
        <div className="workspace-data-list">
          {requests.map((item) => {
            const mayAct = item.assigned_to
              ? item.assigned_to === user?.id
              : item.requested_by === user?.id;
            const isOpen = item.status === "OPEN" || item.status === "IN_PROGRESS";
            return (
              <article className="workspace-data-item" key={item.id}
                id={"request-" + item.id}
                aria-label={item.id === focusedRequestId ? "Selected request: " + item.title : undefined}
                style={item.id === focusedRequestId ? { borderLeft: "4px solid var(--copper)" } : undefined}>
                <div className="workspace-data-row">
                  <div>
                    <h3>{item.title}</h3>
                    <div className="workspace-data-meta">
                      <span>Type: {item.type}</span>
                      <span>Status: {item.status.replaceAll("_", " ")}</span>
                      <span>Assigned: {item.assigned_to
                        ? directory.get(item.assigned_to) || "Company user"
                        : "Unassigned"}</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    {item.description && <p>{item.description}</p>}
                  </div>
                  {mayAct && isOpen && (
                    <div className="workspace-actions">
                      {item.status === "OPEN" && (
                        <button type="button" className="workspace-action workspace-action--secondary"
                          disabled={Boolean(activeId)} onClick={() => changeStatus(item, "IN_PROGRESS")}>
                          Start
                        </button>
                      )}
                      <button type="button" className="workspace-action workspace-action--secondary"
                        disabled={Boolean(activeId)} onClick={() => changeStatus(item, "RESOLVED")}>
                        Resolve
                      </button>
                      <button type="button" className="workspace-action workspace-action--secondary"
                        disabled={Boolean(activeId)} onClick={() => changeStatus(item, "REJECTED")}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
