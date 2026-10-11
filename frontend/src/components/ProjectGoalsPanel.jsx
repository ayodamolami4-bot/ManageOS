import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";
import { apiErrorMessage } from "../utils/validation";
import "./WorkspaceData.css";

export default function ProjectGoalsPanel({ projectId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    get("/projects/" + projectId + "/goals").then((response) => {
      if (!active) return;
      setItems(Array.isArray(response?.data) ? response.data : []);
      setError("");
      setRestricted(false);
    }).catch((reason) => {
      if (!active) return;
      setRestricted(reason?.status === 403);
      setError(apiErrorMessage(reason));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [projectId, version]);

  return (
    <section aria-label="Project goal alignment">
      <div className="workspace-data-row">
        <div>
          <h2>Company goals supported</h2>
          <p className="workspace-data-meta">These are real, saved connections between the project and company objectives.</p>
        </div>
        <button type="button" className="workspace-action workspace-action--secondary"
          disabled={loading} onClick={() => { setLoading(true); setVersion((n) => n + 1); }}>
          Refresh
        </button>
      </div>
      {loading && <p role="status" className="workspace-feedback">Loading goal connections...</p>}
      {!loading && restricted && <p className="workspace-feedback">Your account does not have company-goal viewing permission.</p>}
      {!loading && error && !restricted && <p role="alert" className="workspace-feedback">{error}</p>}
      {!loading && !error && !items.length && (
        <p className="workspace-feedback">No company goal is linked to this project yet. Use the Goals page to connect one.</p>
      )}
      {!loading && !error && (
        <div className="workspace-data-list">
          {items.map((goal) => (
            <article className="workspace-data-item" key={goal.id}>
              <h3>{goal.title}</h3>
              <p className="workspace-data-meta">
                Status: {goal.status?.replaceAll("_", " ")} · Priority: {goal.priority}
              </p>
            </article>
          ))}
          <p><Link to="/app/goals">Manage goal alignment</Link></p>
        </div>
      )}
    </section>
  );
}
