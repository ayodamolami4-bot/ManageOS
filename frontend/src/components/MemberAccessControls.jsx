import { useState } from "react";
import { del, post } from "../services/api";
import { apiErrorMessage } from "../utils/validation";
import "./WorkspaceData.css";

export default function MemberAccessControls({ member, roles, units, onRefresh }) {
  const [unitId, setUnitId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roleUnitId, setRoleUnitId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function execute(action, message) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(message);
      onRefresh();
    } catch (error) {
      setNotice(apiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function addUnit(event) {
    event.preventDefault();
    if (!units.some((unit) => unit.id === unitId)) {
      setNotice("Select a valid organization unit.");
      return;
    }
    execute(
      () => post("/organization-memberships", {
        userId: member.id,
        organizationUnitId: unitId,
      }),
      "Organization membership added."
    );
  }

  function addRole(event) {
    event.preventDefault();
    const role = roles.find((candidate) => candidate.id === roleId);
    if (!role) {
      setNotice("Select an available role.");
      return;
    }
    if (roleUnitId && !units.some((unit) => unit.id === roleUnitId)) {
      setNotice("Select a valid unit for the scoped role.");
      return;
    }
    if (role.name === "OWNER" && roleUnitId) {
      setNotice("The Owner role must be company-wide.");
      return;
    }
    execute(
      () => post("/users/" + member.id + "/roles", {
        roleId,
        organizationUnitId: roleUnitId || null,
      }),
      "Role granted."
    );
  }

  function removeUnit(membership) {
    if (!window.confirm("Remove this person from " + membership.organization_unit_name + "?")) return;
    execute(
      () => del("/organization-memberships/" + membership.id),
      "Organization membership removed."
    );
  }

  function removeRole(role) {
    if (!window.confirm("Remove the " + role.name + " role from this person?")) return;
    const query = role.organization_unit_id
      ? "?organizationUnitId=" + encodeURIComponent(role.organization_unit_id) : "";
    execute(
      () => del("/users/" + member.id + "/roles/" + role.id + query),
      "Role removed."
    );
  }

  const remainingUnits = units.filter((unit) =>
    !(member.memberships || []).some((membership) => membership.organization_unit_id === unit.id)
  );

  return (
    <details>
      <summary>Manage organization and roles</summary>
      <p className="workspace-data-meta">Only authorized company managers can make changes. The backend verifies scope and protects the last Owner.</p>
      {notice && <p role="status" className="workspace-feedback">{notice}</p>}

      <div className="workspace-data-list">
        <div>
          <strong>Organization memberships</strong>
          {(member.memberships || []).length === 0 && <p className="workspace-data-meta">No unit memberships yet. Employees need one before being assigned to tasks.</p>}
          {(member.memberships || []).map((membership) => (
            <div key={membership.id} className="workspace-data-row">
              <span>{membership.organization_unit_name}</span>
              <button className="workspace-action workspace-action--secondary" type="button" disabled={busy}
                onClick={() => removeUnit(membership)}>Remove</button>
            </div>
          ))}
          <form className="workspace-data-form" onSubmit={addUnit} noValidate>
            <div className="workspace-field">
              <label htmlFor={"unit-" + member.id}>Add to organization unit</label>
              <select id={"unit-" + member.id} value={unitId} disabled={busy || !remainingUnits.length}
                onChange={(event) => setUnitId(event.target.value)}>
                <option value="">Choose a unit</option>
                {remainingUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-action" disabled={busy || !remainingUnits.length}>Add membership</button>
            </div>
          </form>
        </div>

        <div>
          <strong>Assigned roles</strong>
          {(member.roles || []).map((role) => (
            <div className="workspace-data-row" key={role.id + ":" + (role.organization_unit_id || "company")}>
              <span>{role.name}{role.organization_unit_name ? " · " + role.organization_unit_name : " · company-wide"}</span>
              <button type="button" className="workspace-action workspace-action--secondary" disabled={busy}
                onClick={() => removeRole(role)}>Remove</button>
            </div>
          ))}
          <form className="workspace-data-form" onSubmit={addRole} noValidate>
            <div className="workspace-field">
              <label htmlFor={"role-" + member.id}>Assign role</label>
              <select id={"role-" + member.id} value={roleId} disabled={busy || !roles.length}
                onChange={(event) => {
                  setRoleId(event.target.value);
                  setRoleUnitId("");
                }}>
                <option value="">Choose a role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div className="workspace-field">
              <label htmlFor={"roleunit-" + member.id}>Scope (optional)</label>
              <select id={"roleunit-" + member.id} value={roleUnitId} disabled={busy}
                onChange={(event) => setRoleUnitId(event.target.value)}>
                <option value="">Company-wide</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-action" disabled={busy || !roles.length}>Assign role</button>
            </div>
          </form>
        </div>
      </div>
    </details>
  );
}
