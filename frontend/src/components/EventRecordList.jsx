import { useEffect, useState } from "react";
import { get } from "../services/api";
import { apiErrorMessage } from "../utils/validation";
import "./WorkspaceData.css";

export default function EventRecordList({ kind }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);
  const isAudit = kind === "audit";
  const path = isAudit ? "/audit-logs" : "/activities";

  useEffect(() => {
    let active = true;
    get(path + "?page=" + page + "&limit=30")
      .then((response) => {
        if (!active) return;
        setItems(Array.isArray(response?.data?.items) ? response.data.items : []);
        setPagination(response?.data?.pagination || null);
        setErrorMessage("");
        setAccessDenied(false);
      })
      .catch((error) => {
        if (!active) return;
        setAccessDenied(error?.status === 403);
        setErrorMessage(error?.status === 403
          ? (isAudit ? "You do not have permission to view audit records." : "You do not have permission to view company activity.")
          : apiErrorMessage(error)
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, page, retryIndex]);

  function goTo(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <section aria-label={isAudit ? "Audit history" : "Operational activity"}>
      <div className="workspace-data-row">
        <div>
          <h2>{isAudit ? "Formal audit events" : "Recent company activity"}</h2>
          <p className="workspace-data-meta">
            {pagination ? String(pagination.total) + " events recorded" : "Permission-controlled history"}
          </p>
        </div>
        <button type="button" className="workspace-action workspace-action--secondary" disabled={loading}
          onClick={() => { setLoading(true); setRetryIndex((n) => n + 1); }}>
          Refresh
        </button>
      </div>

      {loading && <p className="workspace-feedback" role="status">Loading records...</p>}
      {!loading && errorMessage && (
        <div className="workspace-feedback" role="alert">
          <p>{errorMessage}</p>
          {!accessDenied && (
            <button className="workspace-action workspace-action--secondary" type="button"
              onClick={() => { setLoading(true); setRetryIndex((n) => n + 1); }}>
              Retry loading records
            </button>
          )}
        </div>
      )}
      {!loading && !errorMessage && items.length === 0 && (
        <p className="workspace-feedback">
          No {isAudit ? "audit events" : "activity events"} are available to your account.
        </p>
      )}
      {!loading && !errorMessage && (
        <div className="workspace-data-list">
          {items.map((entry) => (
            <article key={entry.id} className="workspace-data-item">
              <h3>{entry.action?.replaceAll("_", " ")}</h3>
              <div className="workspace-data-meta">
                <span>Time: {new Date(entry.created_at).toLocaleString()}</span>
                <span>Resource: {entry.resource_type} ({entry.resource_id?.slice(0, 8)})</span>
                <span>Actor: {entry.actor_id?.slice(0, 8) || "System"}</span>
              </div>
              {isAudit && (
                <details>
                  <summary>View change details</summary>
                  <p>Before</p>
                  <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {JSON.stringify(entry.old_values, null, 2) || "Not recorded"}
                  </pre>
                  <p>After</p>
                  <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {JSON.stringify(entry.new_values, null, 2) || "Not recorded"}
                  </pre>
                </details>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && !errorMessage && pagination && (
        <div className="workspace-actions" style={{ marginTop: 18 }}>
          <button className="workspace-action workspace-action--secondary" type="button"
            disabled={page <= 1} onClick={() => goTo(page - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button className="workspace-action workspace-action--secondary" type="button"
            disabled={!pagination.hasNextPage} onClick={() => goTo(page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}
