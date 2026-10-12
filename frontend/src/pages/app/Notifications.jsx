import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { get, put } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import { notificationDestination } from "../../utils/notificationDestination";
import "../../components/WorkspaceData.css";
import "./Notifications.css";

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    get("/notifications")
      .then((response) => {
        if (active) {
          setItems(Array.isArray(response?.data) ? response.data : []);
          setError("");
        }
      })
      .catch((reason) => {
        if (active) setError(apiErrorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  async function markRead(item) {
    if (busy || item.read_at) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await put("/notifications/" + item.id + "/read", {});
      setItems((current) => current.map((entry) =>
        entry.id === item.id ? response?.data || { ...entry, read_at: new Date().toISOString() } : entry
      ));
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setNotice("");
    try {
      const unread = items.filter((item) => !item.read_at);
      for (const item of unread) {
        const response = await put("/notifications/" + item.id + "/read", {});
        setItems((current) => current.map((entry) =>
          entry.id === item.id ? response?.data || { ...entry, read_at: new Date().toISOString() } : entry
        ));
      }
      setNotice("Notifications marked as read.");
    } catch (reason) {
      setNotice("Some notifications could not be updated: " + apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const unread = items.filter((item) => !item.read_at);
  const typeCount = (prefix) => items.filter((item) => item.type?.toUpperCase().includes(prefix)).length;
  const reviewCount = items.filter((item) => /REVIEW|SUBMIT|NEEDS_CHANGES|TASK_COMPLETED/.test(item.type || "")).length;

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-kicker">PERSONAL WORKSPACE</p>
          <h1>Notifications<span> show what needs your attention.</span></h1>
          <p className="notifications-intro">Events relevant to your account and responsibilities, directly from the company API.</p>
        </div>
        <button type="button" className="notifications-mark-button" disabled={busy || unread.length === 0}
          onClick={markAllRead}>Mark all as read</button>
      </header>

      <section className="notifications-overview">
        <div className="notifications-state-grid">
          {[
            ["UNREAD", loading || error ? "—" : unread.length, "Notifications that have not been read"],
            ["ASSIGNMENTS", loading || error ? "—" : typeCount("ASSIGN"), "Notifications about assignments"],
            ["REVIEWS", loading || error ? "—" : reviewCount, "Review and decision notifications"],
            ["REQUESTS", loading || error ? "—" : typeCount("REQUEST"), "Request-related notifications"],
          ].map(([label, count, detail]) => (
            <article className="notifications-state" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="notifications-inbox">
        <div className="notifications-section-heading">
          <div>
            <p className="notifications-section-kicker">NOTIFICATION HISTORY</p>
            <h2>Recent events for your account.</h2>
          </div>
        </div>
        {notice && <p className="workspace-feedback" role="status">{notice}</p>}
        {loading && <p className="workspace-feedback" role="status">Loading notifications...</p>}
        {!loading && error && (
          <p className="workspace-feedback" role="alert">
            {error}{" "}
            <button type="button" className="workspace-action workspace-action--secondary" onClick={() => { setLoading(true); setVersion((n) => n + 1); }}>
              Retry
            </button>
          </p>
        )}
        {!loading && !error && items.length === 0 && <p className="workspace-feedback">No notifications yet.</p>}
        {!loading && !error && (
          <div className="workspace-data-list">
            {items.map((item) => (
              <article key={item.id} className="workspace-data-item">
                <div className="workspace-data-row">
                  <div>
                    <p className="workspace-data-meta">{item.type?.replaceAll("_", " ")} · {new Date(item.created_at).toLocaleString()}</p>
                    <h3>{item.title}</h3>
                    <p>{item.message}</p>
                  </div>
                  <div className="workspace-actions">
                    {notificationDestination(item) && (
                      <Link
                        className="workspace-action"
                        to={notificationDestination(item)}
                        onClick={() => { if (!item.read_at) void markRead(item); }}
                      >
                        Open related work
                      </Link>
                    )}
                    {!item.read_at ? (
                      <button type="button" className="workspace-action workspace-action--secondary"
                        disabled={busy} onClick={() => markRead(item)}>Mark read</button>
                    ) : <span className="workspace-data-meta">Read</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notifications;
