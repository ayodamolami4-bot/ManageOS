import { useEffect, useState } from "react";
import { del, get, post } from "../services/api";
import { apiErrorMessage } from "../utils/validation";
import "./WorkspaceData.css";

function displayName(person) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ") || person.email || "Team member";
}

export default function ProjectRelationshipsPanel({ projectId }) {
  const [members, setMembers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [linkedUnits, setLinkedUnits] = useState([]);
  const [companyUsers, setCompanyUsers] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [notice, setNotice] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedLead, setSelectedLead] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const requests = [
      ["Members", get("/project-relationships/" + projectId + "/members")],
      ["Leads", get("/project-relationships/" + projectId + "/leads")],
      ["Units", get("/project-relationships/" + projectId + "/organization-units")],
      ["Company members", get("/users")],
      ["Organization", get("/organization-units")],
    ];
    Promise.allSettled(requests.map(([, call]) => call)).then((results) => {
      if (!active) return;
      const failures = [];
      results.forEach((result, index) => {
        const name = requests[index][0];
        if (result.status === "rejected") {
          if (index < 3) failures.push(name + ": " + apiErrorMessage(result.reason));
          return;
        }
        const data = Array.isArray(result.value?.data) ? result.value.data : [];
        if (index === 0) setMembers(data);
        if (index === 1) setLeads(data);
        if (index === 2) setLinkedUnits(data);
        if (index === 3) setCompanyUsers(data);
        if (index === 4) setAllUnits(data);
      });
      setIssues(failures);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [projectId, version]);

  function reload() {
    setLoading(true);
    setVersion((value) => value + 1);
  }

  async function createRelationship(event, kind, value) {
    event.preventDefault();
    const directory = kind === "organization-units" ? allUnits : companyUsers || [];
    if (!directory.some((item) => item.id === value)) {
      setNotice("Choose a valid company member or unit.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      await post("/project-relationships/" + projectId + "/" + kind,
        kind === "organization-units"
          ? { organizationUnitId: value }
          : { userId: value }
      );
      if (kind === "organization-units") setSelectedUnit("");
      if (kind === "leads") setSelectedLead("");
      if (kind === "members") setSelectedMember("");
      setNotice("Project relationship saved.");
      reload();
    } catch (error) {
      setNotice(apiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeRelationship(type, person) {
    if (!window.confirm("Remove " + displayName(person) + " from project " + type + "?")) return;
    setBusy(true);
    setNotice("");
    try {
      await del("/project-relationships/" + projectId + "/" + type + "/" + person.id);
      setNotice("Project " + (type === "leads" ? "lead" : "member") + " removed.");
      reload();
    } catch (error) {
      setNotice(apiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const candidates = companyUsers || [];
  const availableUnits = allUnits.filter((unit) => !linkedUnits.some((linked) => linked.id === unit.id));
  const availableMembers = candidates.filter((person) => !members.some((member) => member.id === person.id));
  const potentialLeads = candidates.filter((person) =>
    !leads.some((lead) => lead.id === person.id) &&
    person.roles?.some((role) => ["MANAGER", "TEAM_LEAD"].includes(role.name))
  );

  return (
    <section aria-label="Project team and organization">
      <div className="workspace-data-row">
        <div>
          <h2>Project organization and people</h2>
          <p className="workspace-data-meta">Link the responsible units, then select the managers, team leads and members who move this project forward.</p>
        </div>
        <button className="workspace-action workspace-action--secondary" type="button" disabled={loading} onClick={reload}>Refresh</button>
      </div>

      {loading && <p className="workspace-feedback" role="status">Loading project team...</p>}
      {issues.length > 0 && <p role="alert" className="workspace-feedback">{issues.join(" · ")}</p>}
      {notice && <p role="status" className="workspace-feedback">{notice}</p>}

      {!loading && (
        <div className="workspace-data-list">
          <article className="workspace-data-item">
            <h3>Responsible organization units</h3>
            <p className="workspace-data-meta">{linkedUnits.length ? linkedUnits.map((unit) => unit.name).join(", ") : "No unit linked yet."}</p>
            {companyUsers && (
              <form className="workspace-data-form" noValidate onSubmit={(event) =>
                createRelationship(event, "organization-units", selectedUnit)
              }>
                <div className="workspace-field">
                  <label htmlFor="project-link-unit">Link organization unit</label>
                  <select id="project-link-unit" value={selectedUnit} disabled={busy}
                    onChange={(event) => setSelectedUnit(event.target.value)}>
                    <option value="">Choose a unit</option>
                    {availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                  </select>
                </div>
                <div className="workspace-actions">
                  <button className="workspace-action" type="submit" disabled={busy || !availableUnits.length}>Link unit</button>
                </div>
              </form>
            )}
          </article>

          <article className="workspace-data-item">
            <h3>Project leads</h3>
            {leads.length === 0 && <p className="workspace-data-meta">No project leads assigned yet.</p>}
            {leads.map((lead) => (
              <div className="workspace-data-row" key={lead.id}>
                <span>{displayName(lead)}</span>
                <button className="workspace-action workspace-action--secondary" type="button"
                  disabled={busy} onClick={() => removeRelationship("leads", lead)}>
                  Remove lead
                </button>
              </div>
            ))}
            {companyUsers && (
              <form className="workspace-data-form" noValidate onSubmit={(event) =>
                createRelationship(event, "leads", selectedLead)
              }>
                <div className="workspace-field">
                  <label htmlFor="project-lead">Assign manager or team lead</label>
                  <select id="project-lead" value={selectedLead} disabled={busy}
                    onChange={(event) => setSelectedLead(event.target.value)}>
                    <option value="">Choose a qualified company member</option>
                    {potentialLeads.map((person) => <option key={person.id} value={person.id}>{displayName(person)}</option>)}
                  </select>
                </div>
                <div className="workspace-actions">
                  <button className="workspace-action" type="submit" disabled={busy || !potentialLeads.length}>Assign lead</button>
                </div>
                <p className="workspace-data-meta workspace-field--wide">A scoped manager or team lead must have permission over a linked project unit.</p>
              </form>
            )}
          </article>

          <article className="workspace-data-item">
            <h3>Project members</h3>
            {members.length === 0 && <p className="workspace-data-meta">No members yet.</p>}
            {members.map((member) => (
              <div className="workspace-data-row" key={member.id}>
                <span>{displayName(member)}</span>
                <button className="workspace-action workspace-action--secondary" type="button"
                  disabled={busy} onClick={() => removeRelationship("members", member)}>
                  Remove member
                </button>
              </div>
            ))}
            {companyUsers && (
              <form className="workspace-data-form" noValidate onSubmit={(event) =>
                createRelationship(event, "members", selectedMember)
              }>
                <div className="workspace-field">
                  <label htmlFor="project-member">Add project member</label>
                  <select id="project-member" value={selectedMember} disabled={busy}
                    onChange={(event) => setSelectedMember(event.target.value)}>
                    <option value="">Choose a company member</option>
                    {availableMembers.map((person) => <option key={person.id} value={person.id}>{displayName(person)}</option>)}
                  </select>
                </div>
                <div className="workspace-actions">
                  <button className="workspace-action" type="submit" disabled={busy || !availableMembers.length}>Add member</button>
                </div>
                <p className="workspace-data-meta workspace-field--wide">Employees must have membership in an eligible organization unit before tasks can be assigned to them.</p>
              </form>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
