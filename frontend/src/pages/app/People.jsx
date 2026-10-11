import { useEffect, useState } from "react";

import { get, post } from "../../services/api";
import MemberAccessControls from "../../components/MemberAccessControls";
import { apiErrorMessage, apiFieldErrors } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./People.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function People() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [version, setVersion] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [draft, setDraft] = useState({ email: "", roleId: "", organizationUnitId: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      get("/users"),
      get("/users/roles"),
      get("/organization-units"),
    ]).then(([peopleResult, roleResult, unitResult]) => {
      if (!active) return;
      if (peopleResult.status === "fulfilled") {
        setUsers(Array.isArray(peopleResult.value?.data) ? peopleResult.value.data : []);
        setLoadError("");
      } else {
        setLoadError(apiErrorMessage(peopleResult.reason));
      }
      if (roleResult.status === "fulfilled") {
        setRoles(Array.isArray(roleResult.value?.data) ? roleResult.value.data : []);
      }
      if (unitResult.status === "fulfilled") {
        setUnits(Array.isArray(unitResult.value?.data) ? unitResult.value.data : []);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [version]);

  function refresh() {
    setLoading(true);
    setVersion((current) => current + 1);
  }

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!emailPattern.test(draft.email.trim()) || draft.email.trim().length > 254) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!roles.some((role) => role.id === draft.roleId)) {
      nextErrors.roleId = "Choose a valid role.";
    }
    if (
      draft.organizationUnitId &&
      !units.some((unit) => unit.id === draft.organizationUnitId)
    ) {
      nextErrors.organizationUnitId = "Choose an existing unit.";
    }

    setErrors(nextErrors);
    setFeedback("");
    setInvitationUrl("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/invitations", {
        email: draft.email.trim().toLowerCase(),
        roleId: draft.roleId,
        organizationUnitId: draft.organizationUnitId || null,
      });

      setFeedback(response?.data?.token
        ? "Invitation created. Share the following development-only link securely:"
        : "Invitation record created. Email delivery is not configured, so no invitation email has been sent.");
      if (response?.data?.token) {
        setInvitationUrl(window.location.origin + "/invite?token=" + encodeURIComponent(response.data.token));
      }
      setInviteOpen(false);
      setDraft({ email: "", roleId: "", organizationUnitId: "" });
    } catch (error) {
      setFeedback(apiErrorMessage(error));
      setErrors(apiFieldErrors(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="people-page">
      <section className="people-header">
        <div>
          <p className="people-eyebrow">COMPANY PEOPLE</p>
          <h1>Manage the people who make the company work.</h1>
          <p className="people-intro">
            View company members, their roles and organizational responsibilities,
            and invite new colleagues to join the workspace.
          </p>
        </div>
        <div className="people-context">
          <span className="people-context-label">WORKSPACE</span>
          <strong>Company members</strong>
        </div>
      </section>

      <section className="people-summary">
        <div className="people-summary-item">
          <span>MEMBERS</span>
          <strong>{loading || loadError ? "—" : users.length}</strong>
          <p>Registered people in the company.</p>
        </div>
        <div className="people-summary-item">
          <span>ASSIGNED ROLES</span>
          <strong>{loading || loadError ? "—" : users.reduce((total, user) => total + (user.roles?.length || 0), 0)}</strong>
          <p>Responsibilities assigned to company members.</p>
        </div>
        <div className="people-summary-item">
          <span>UNIT MEMBERSHIPS</span>
          <strong>{loading || loadError ? "—" : users.reduce((total, user) => total + (user.memberships?.length || 0), 0)}</strong>
          <p>Links between people and organization units.</p>
        </div>
      </section>

      <section className="people-section">
        <div className="people-section-header">
          <div>
            <p className="people-section-kicker">COMPANY MEMBERS</p>
            <h2>People</h2>
          </div>
          <div className="workspace-actions">
            <button className="workspace-action workspace-action--secondary" type="button" onClick={refresh}>Refresh</button>
            <button className="people-invite-button" type="button" onClick={() => setInviteOpen((open) => !open)}>
              {inviteOpen ? "Cancel invitation" : "Invite person"}
            </button>
          </div>
        </div>

        {feedback && <p className="workspace-feedback" role="status">{feedback}</p>}
        {invitationUrl && (
          <p className="workspace-feedback workspace-feedback--success">
            <a href={invitationUrl}>{invitationUrl}</a>
          </p>
        )}

        {inviteOpen && (
          <form className="workspace-data-form" onSubmit={submit} noValidate>
            <div className="workspace-field workspace-field--wide">
              <label htmlFor="invite-person-email">Invitee email</label>
              <input id="invite-person-email" type="email" maxLength={254} required
                value={draft.email} disabled={saving}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => update("email", event.target.value)}
                placeholder="colleague@company.com"
              />
              {errors.email && <span className="workspace-field-error" role="alert">{errors.email}</span>}
            </div>
            <div className="workspace-field">
              <label htmlFor="invite-person-role">Role</label>
              <select id="invite-person-role" value={draft.roleId} disabled={saving || !roles.length}
                aria-invalid={Boolean(errors.roleId)}
                onChange={(event) => update("roleId", event.target.value)}
              >
                <option value="">Choose a role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              {errors.roleId && <span className="workspace-field-error" role="alert">{errors.roleId}</span>}
            </div>
            <div className="workspace-field">
              <label htmlFor="invite-person-unit">Organization unit (optional)</label>
              <select id="invite-person-unit" value={draft.organizationUnitId} disabled={saving}
                aria-invalid={Boolean(errors.organizationUnitId)}
                onChange={(event) => update("organizationUnitId", event.target.value)}
              >
                <option value="">Company-wide / none</option>
                {units.map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}
              </select>
              {errors.organizationUnitId && (
                <span role="alert" className="workspace-field-error">{errors.organizationUnitId}</span>
              )}
            </div>
            <div className="workspace-actions">
              <button className="workspace-action" type="submit" disabled={saving || !roles.length}>
                {saving ? "Creating..." : "Create invitation"}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="workspace-feedback" role="status">Loading people...</p>}
        {!loading && loadError && <p className="workspace-feedback" role="alert">{loadError}</p>}
        {!loading && !loadError && users.length === 0 && <p className="workspace-feedback">No members found.</p>}
        {!loading && !loadError && (
          <div className="workspace-data-list">
            {users.map((user) => (
              <article key={user.id} className="workspace-data-item">
                <h3>{[user.first_name, user.last_name].filter(Boolean).join(" ")}</h3>
                <p className="workspace-data-meta">{user.email}</p>
                <div className="workspace-data-meta">
                  <span>Roles: {user.roles?.map((role) => role.name).join(", ") || "No role assigned"}</span>
                  <span>Units: {user.memberships?.map((membership) => membership.organization_unit_name).join(", ") || "No unit assigned"}</span>
                </div>
                <MemberAccessControls member={user} roles={roles} units={units} onRefresh={refresh} />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default People;
