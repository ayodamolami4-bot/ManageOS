import { useEffect, useState } from "react";

import { useAuth } from "../../context/useAuth";
import { get, post } from "../../services/api";
import { apiErrorMessage, apiFieldErrors } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./Discussions.css";

function Discussions() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ resourceType: "COMPANY", resourceId: "", title: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.allSettled([get("/discussions"), get("/projects")])
      .then(([discussionResult, projectResult]) => {
        if (!active) return;
        if (discussionResult.status === "fulfilled") {
          setDiscussions(Array.isArray(discussionResult.value?.data) ? discussionResult.value.data : []);
          setLoadError("");
        } else {
          setLoadError(apiErrorMessage(discussionResult.reason));
        }
        if (projectResult.status === "fulfilled") {
          setProjects(Array.isArray(projectResult.value?.data) ? projectResult.value.data : []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    if (!selectedId) {
      setComments([]);
      return () => { active = false; };
    }

    setCommentsLoading(true);
    setCommentError("");
    get("/discussions/" + selectedId + "/comments")
      .then((response) => {
        if (active) setComments(Array.isArray(response?.data) ? response.data : []);
      })
      .catch((error) => {
        if (active) setCommentError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setCommentsLoading(false);
      });

    return () => { active = false; };
  }, [selectedId]);

  async function create(event) {
    event.preventDefault();
    const nextErrors = {};
    const resourceId = draft.resourceType === "COMPANY" ? user?.company_id : draft.resourceId;

    if (!draft.title.trim()) nextErrors.title = "Discussion title is required.";
    else if (draft.title.trim().length > 255) nextErrors.title = "Title cannot exceed 255 characters.";

    if (draft.resourceType === "COMPANY") {
      if (!resourceId) nextErrors.resourceId = "Company context is unavailable.";
    } else if (!projects.some((project) => project.id === resourceId)) {
      nextErrors.resourceId = "Choose a project you can access.";
    }

    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await post("/discussions", {
        resourceType: draft.resourceType,
        resourceId,
        title: draft.title.trim()
      });
      if (response?.data) {
        setDiscussions((current) => [response.data, ...current]);
      }
      setDraft({ resourceType: "COMPANY", resourceId: "", title: "" });
      setFormOpen(false);
      setMessage("Discussion started.");
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!selectedId) return;

    if (!comment.trim() || comment.trim().length > 10000) {
      setCommentError("Comment must contain 1–10,000 characters.");
      return;
    }

    setPosting(true);
    setCommentError("");
    try {
      const response = await post("/discussions/" + selectedId + "/comments", {
        content: comment.trim()
      });
      if (response?.data) setComments((current) => [...current, response.data]);
      setComment("");
    } catch (error) {
      setCommentError(apiErrorMessage(error));
    } finally {
      setPosting(false);
    }
  }

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="discussions-page">
      <header className="discussions-header">
        <div>
          <p className="discussions-kicker">WORK COMMUNICATION</p>
          <h1>Discussions<span> keep conversation with the work.</span></h1>
          <p className="discussions-intro">
            Organize conversations around the company or a project, and keep replies in context.
          </p>
        </div>
      </header>

      <section className="discussions-stream">
        <div className="workspace-data-row">
          <div>
            <p className="discussions-section-kicker">DISCUSSION SPACE</p>
            <h2>Company conversations</h2>
          </div>
          <button type="button" className="workspace-action" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? "Cancel" : "Start discussion"}
          </button>
        </div>

        {message && <p className="workspace-feedback" role="status">{message}</p>}

        {formOpen && (
          <form className="workspace-data-form" onSubmit={create} noValidate>
            <div className="workspace-field">
              <label htmlFor="discussion-context">Discussion context</label>
              <select id="discussion-context" value={draft.resourceType} disabled={saving}
                onChange={(event) => setDraft((current) => ({
                  ...current, resourceType: event.target.value, resourceId: ""
                }))}
              >
                <option value="COMPANY">Company-wide</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>

            {draft.resourceType === "PROJECT" && (
              <div className="workspace-field">
                <label htmlFor="discussion-project">Project</label>
                <select id="discussion-project" value={draft.resourceId} disabled={saving}
                  aria-invalid={Boolean(errors.resourceId)}
                  onChange={(event) => setDraft((current) => ({ ...current, resourceId: event.target.value }))}
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                {errors.resourceId && <span role="alert" className="workspace-field-error">{errors.resourceId}</span>}
              </div>
            )}

            <div className="workspace-field workspace-field--wide">
              <label htmlFor="discussion-title">Discussion title</label>
              <input id="discussion-title" required maxLength={255} value={draft.title} disabled={saving}
                aria-invalid={Boolean(errors.title)}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
              {errors.title && <span role="alert" className="workspace-field-error">{errors.title}</span>}
            </div>

            <div className="workspace-actions">
              <button type="submit" className="workspace-action" disabled={saving}>
                {saving ? "Creating..." : "Start discussion"}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="workspace-feedback" role="status">Loading discussions...</p>}
        {!loading && loadError && <p className="workspace-feedback" role="alert">{loadError}</p>}
        {!loading && !loadError && discussions.length === 0 && <p className="workspace-feedback">No discussions have been started yet.</p>}

        {!loading && !loadError && (
          <div className="workspace-data-list">
            {discussions.map((discussion) => (
              <article className="workspace-data-item" key={discussion.id}>
                <div className="workspace-data-row">
                  <div>
                    <h3>{discussion.title}</h3>
                    <div className="workspace-data-meta">
                      <span>{discussion.resource_type}</span>
                      {discussion.resource_type === "PROJECT" && (
                        <span>{projectNames.get(discussion.resource_id) || "Project discussion"}</span>
                      )}
                      <span>{new Date(discussion.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button type="button" className="workspace-action workspace-action--secondary"
                    onClick={() => setSelectedId((current) => current === discussion.id ? "" : discussion.id)}>
                    {selectedId === discussion.id ? "Close replies" : "View replies"}
                  </button>
                </div>

                {selectedId === discussion.id && (
                  <div>
                    {commentsLoading && <p role="status" className="workspace-feedback">Loading replies...</p>}
                    {commentError && <p role="alert" className="workspace-feedback">{commentError}</p>}
                    {!commentsLoading && comments.length === 0 && !commentError && <p>No replies yet.</p>}
                    {comments.map((entry) => (
                      <div key={entry.id} className="workspace-data-item">
                        <p>{entry.content}</p>
                        <p className="workspace-data-meta">{new Date(entry.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    <form className="workspace-data-form" onSubmit={addComment} noValidate>
                      <div className="workspace-field workspace-field--wide">
                        <label htmlFor="discussion-comment">Reply</label>
                        <textarea id="discussion-comment" maxLength={10000} required disabled={posting}
                          value={comment} onChange={(event) => setComment(event.target.value)}
                        />
                      </div>
                      <div className="workspace-actions">
                        <button type="submit" className="workspace-action" disabled={posting}>
                          {posting ? "Posting..." : "Post reply"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Discussions;
