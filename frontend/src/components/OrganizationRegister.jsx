import { useEffect, useState } from "react";

import { get, post } from "../services/api";
import { useAuth } from "../context/useAuth";
import {
  apiErrorMessage,
  apiFieldErrors,
  validateUnitDraft,
} from "../utils/validation";
import "./WorkspaceData.css";

const initialDraft = {
  name: "",
  type: "",
  parentUnitId: "",
  description: "",
};

export default function OrganizationRegister() {
  const { user } = useAuth();
  const canCreateUnit = (user?.roles || []).some((role) =>
    role.name === "OWNER" || (role.name === "MANAGER" && !role.organization_unit_id)
  );
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    get("/organization-units")
      .then((response) => {
        if (active) {
          setUnits(Array.isArray(response?.data) ? response.data : []);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshIndex]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function retry() {
    setLoading(true);
    setRefreshIndex((previous) => previous + 1);
  }

  function closeForm() {
    setFormOpen(false);
    setDraft(initialDraft);
    setErrors({});
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateUnitDraft(draft);
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/organization-units", {
        name: draft.name.trim(),
        type: draft.type.trim(),
        description: draft.description.trim() || null,
        parentUnitId: draft.parentUnitId || null,
      });

      if (response?.data) {
        setUnits((current) =>
          [...current, response.data].sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        retry();
      }

      closeForm();
      setMessage("Organization unit created.");
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const names = new Map(units.map((unit) => [unit.id, unit.name]));

  function fieldError(field) {
    return errors[field] ? (
      <span className="workspace-field-error" role="alert" id={"unit-" + field + "-error"}>
        {errors[field]}
      </span>
    ) : null;
  }

  return (
    <section aria-label="Organization register">
      <div className="workspace-data-row">
        <div>
          <h2>Organization units</h2>
          <p className="workspace-data-meta">
            {loading ? "Loading..." : String(units.length) + " units"}
          </p>
        </div>
        {canCreateUnit && !formOpen && (
          <button type="button" className="workspace-action" onClick={() => setFormOpen(true)}>
            Add organization unit
          </button>
        )}
      </div>

      {message && <p className="workspace-feedback" role="status">{message}</p>}

      {formOpen && (
        <form className="workspace-data-form" onSubmit={submit} noValidate>
          <div className="workspace-field">
            <label htmlFor="unit-name">Unit name</label>
            <input
              id="unit-name"
              required
              maxLength={150}
              value={draft.name}
              disabled={saving}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "unit-name-error" : undefined}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Lagos Operations"
            />
            {fieldError("name")}
          </div>
          <div className="workspace-field">
            <label htmlFor="unit-type">Unit type</label>
            <input
              id="unit-type"
              required
              maxLength={50}
              value={draft.type}
              disabled={saving}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? "unit-type-error" : undefined}
              onChange={(event) => update("type", event.target.value)}
              placeholder="e.g. Department, Branch or Division"
            />
            {fieldError("type")}
          </div>
          <div className="workspace-field workspace-field--wide">
            <label htmlFor="unit-parentUnitId">Parent unit (optional)</label>
            <select
              id="unit-parentUnitId"
              disabled={saving}
              value={draft.parentUnitId}
              aria-invalid={Boolean(errors.parentUnitId)}
              onChange={(event) => update("parentUnitId", event.target.value)}
            >
              <option value="">Company level — no parent</option>
              {units.map((unit) => (
                <option value={unit.id} key={unit.id}>{unit.name} ({unit.type})</option>
              ))}
            </select>
            {fieldError("parentUnitId")}
          </div>
          <div className="workspace-field workspace-field--wide">
            <label htmlFor="unit-description">Description (optional)</label>
            <textarea
              id="unit-description"
              maxLength={10000}
              value={draft.description}
              disabled={saving}
              aria-invalid={Boolean(errors.description)}
              onChange={(event) => update("description", event.target.value)}
            />
            {fieldError("description")}
          </div>
          <div className="workspace-actions">
            <button type="submit" className="workspace-action" disabled={saving}>
              {saving ? "Creating..." : "Create unit"}
            </button>
            <button type="button" className="workspace-action workspace-action--secondary" disabled={saving} onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="workspace-feedback" role="status">Loading organization...</p>}
      {!loading && loadError && (
        <p className="workspace-feedback" role="alert">
          {loadError}{" "}
          <button type="button" className="workspace-action workspace-action--secondary" onClick={retry}>
            Retry
          </button>
        </p>
      )}
      {!loading && !loadError && units.length === 0 && (
        <p className="workspace-feedback">No organization units have been created yet.</p>
      )}
      {!loading && !loadError && (
        <div className="workspace-data-list">
          {units.map((unit) => (
            <article className="workspace-data-item" key={unit.id}>
              <h3>{unit.name}</h3>
              <div className="workspace-data-meta">
                <span>Type: {unit.type}</span>
                <span>Parent: {unit.parent_unit_id ? names.get(unit.parent_unit_id) || "Unavailable" : "Company level"}</span>
              </div>
              {unit.description && <p>{unit.description}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
