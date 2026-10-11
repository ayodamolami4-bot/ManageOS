import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { get } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./Overview.css";

const sections = [
  ["goals", "/goals"],
  ["projects", "/projects"],
  ["tasks", "/tasks"],
  ["notifications", "/notifications"],
];

function Overview() {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled(sections.map(([, endpoint]) => get(endpoint)))
      .then((results) => {
        if (!active) return;
        const nextData = {};
        const nextErrors = {};
        results.forEach((result, index) => {
          const section = sections[index][0];
          if (result.status === "fulfilled") {
            nextData[section] = Array.isArray(result.value?.data) ? result.value.data : [];
          } else {
            nextErrors[section] = apiErrorMessage(result.reason);
          }
        });
        setData(nextData);
        setErrors(nextErrors);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshCount]);

  const projects = data.projects || [];
  const tasks = data.tasks || [];
  const goals = data.goals || [];
  const notifications = data.notifications || [];

  function countText(key, number) {
    return loading ? "…" : errors[key] ? "Access limited" : number;
  }

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <p className="overview-kicker">COMPANY OVERVIEW</p>
          <h1>See what is happening<span> across the company.</span></h1>
          <p className="overview-intro">
            A current view of the goals, projects and work visible to your account.
          </p>
        </div>
        <button type="button" className="workspace-action" disabled={loading}
          onClick={() => { setLoading(true); setRefreshCount((n) => n + 1); }}>
          Refresh overview
        </button>
      </header>

      <section className="overview-direction">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">DIRECTION</p>
            <h2><Link to="/app/goals">Company goals</Link></h2>
          </div>
        </div>
        {errors.goals && <p className="workspace-feedback" role="status">Goals: {errors.goals}</p>}
        <div className="overview-empty-panel overview-direction-panel">
          <div>
            <strong>{countText("goals", goals.length)} goals visible</strong>
            {!errors.goals && goals.length === 0 && !loading && (
              <p>No goals have been created or made visible to this account yet.</p>
            )}
            {goals.slice(0, 4).map((goal) => (
              <p key={goal.id}>
                <strong>{goal.title}</strong> — {goal.status?.replaceAll("_", " ")}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="overview-work">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">EXECUTION</p>
            <h2>Work moving through the company.</h2>
          </div>
        </div>
        <div className="overview-work-grid">
          <article className="overview-work-panel overview-work-panel-green">
            <span className="overview-panel-label">PROJECTS</span>
            <strong>{countText("projects", projects.length)}</strong>
            <p><Link to="/app/projects">View projects</Link></p>
          </article>
          <article className="overview-work-panel overview-work-panel-copper">
            <span className="overview-panel-label">TASKS IN PROGRESS</span>
            <strong>{countText("tasks", tasks.filter((task) => task.status === "IN_PROGRESS").length)}</strong>
            <p><Link to="/app/work">View work</Link></p>
          </article>
          <article className="overview-work-panel overview-work-panel-lime">
            <span className="overview-panel-label">UNREAD NOTIFICATIONS</span>
            <strong>{countText("notifications", notifications.filter((notification) => !notification.read_at).length)}</strong>
            <p><Link to="/app/notifications">View notifications</Link></p>
          </article>
        </div>
        {Object.entries(errors)
          .filter(([key]) => key !== "goals")
          .map(([key, message]) => (
            <p className="workspace-feedback" key={key} role="status">{key}: {message}</p>
          ))}
      </section>

      <section className="overview-record">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">RECENT WORK</p>
            <h2>Tasks available to your account.</h2>
          </div>
        </div>
        {!loading && !errors.tasks && tasks.length === 0 && (
          <p className="workspace-feedback">No visible tasks yet.</p>
        )}
        <div className="workspace-data-list">
          {tasks.slice(0, 5).map((task) => (
            <article className="workspace-data-item" key={task.id}>
              <h3>{task.title}</h3>
              <p className="workspace-data-meta">
                <span>Status: {task.status?.replaceAll("_", " ")}</span>
                <span>Priority: {task.priority}</span>
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Overview;
