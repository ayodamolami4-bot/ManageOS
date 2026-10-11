import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { del, get, post } from "../services/api";
import { apiErrorMessage } from "../utils/validation";
import "./WorkspaceData.css";

export default function GoalAlignmentPanel({ goalId }) {
  const { user } = useAuth();
  const canManage = (user?.roles || []).some((role) =>
    role.name === "OWNER" || (role.name === "MANAGER" && !role.organization_unit_id)
  );
  const [linked, setLinked] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      get("/goals/" + goalId + "/projects"),
      ...(canManage ? [get("/projects")] : []),
    ]).then((results) => {
      if (!active) return;
      const connected = results[0];
      if (connected.status === "fulfilled") {
        setLinked(Array.isArray(connected.value?.data) ? connected.value.data : []);
        setError("");
      } else {
        setError(apiErrorMessage(connected.reason));
      }
      if (canManage && results[1]) {
        if (results[1].status === "fulfilled") {
          setProjects(Array.isArray(results[1].value?.data) ? results[1].value.data : []);
          setProjectError("");
        } else {
          setProjectError(apiErrorMessage(results[1].reason));
        }
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [goalId, canManage, version]);

  function reload() {
    setLoading(true);
    setVersion((count) => count + 1);
  }

  async function link(event) {
    event.preventDefault();
    if (!projects.some((project) => project.id === projectId)) {
      setNotice("Choose a project from your company.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await post("/goals/" + goalId + "/projects", { projectId });
      setProjectId("");
      setNotice("Project linked to this goal.");
      reload();
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function unlink(project) {
    if (!window.confirm("Remove " + project.name + " from this goal? The project itself will remain.")) return;
    setBusy(true);
    setNotice("");
    try {
      await del("/goals/" + goalId + "/projects/" + project.id);
      setNotice("Project unlinked. The project and its tasks were not deleted.");
      reload();
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const available = projects.filter((project) =>
    !linked.some((item) => item.id === project.id)
  );

  return (
    <section aria-label="Projects aligned with goal" className="workspace-data-item">
      <div className="workspace-data-row">
        <div>
          <h4>Projects advancing this goal</h4>
          <p className="workspace-data-meta">Connect outcomes to actual project delivery and track their status.</p>
        </div>
        <button type="button" className="workspace-action workspace-action--secondary"
          onClick={reload} disabled={loading || busy}>Refresh links</button>
      </div>

      {notice && <p className="workspace-feedback" role="status">{notice}</p>}
      {loading && <p className="workspace-feedback" role="status">Loading aligned projects...</p>}
      {!loading && error && <p className="workspace-feedback" role="alert">{error}</p>}
      {!loading && !error && linked.length === 0 && (
        <p className="workspace-feedback">This goal is not yet linked to any project.</p>
      )}
      {!loading && !error && linked.map((project) => (
        <div className="workspace-data-row" key={project.id}>
          <div>
            <Link to={"/app/projects/" + project.id}>{project.name}</Link>
            <p className="workspace-data-meta">Status: {project.status?.replaceAll("_", " ")}</p>
          </div>
          {canManage && (
            <button type="button" className="workspace-action workspace-action--secondary"
              disabled={busy} onClick={() => unlink(project)}>Unlink</button>
          )}
        </div>
      ))}

      {canManage && !loading && !error && (
        <form className="workspace-data-form" onSubmit={link} noValidate>
          <div className="workspace-field">
            <label htmlFor={"goal-project-" + goalId}>Connect an existing project</label>
            <select id={"goal-project-" + goalId} value={projectId} disabled={busy || Boolean(projectError)}
              onChange={(event) => setProjectId(event.target.value)}>
              <option value="">Choose a project</option>
              {available.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {projectError && <p className="workspace-feedback" role="alert">{projectError}</p>}
          </div>
          <div className="workspace-actions">
            <button type="submit" className="workspace-action" disabled={busy || !available.length || Boolean(projectError)}>
              {busy ? "Saving..." : "Link project"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
