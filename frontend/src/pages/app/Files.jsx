import { useEffect, useRef, useState } from "react";

import { API_BASE_URL, del, get, upload } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "../../components/WorkspaceData.css";
import "./Files.css";

const extensions = new Set([
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "txt", "csv",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
]);

function Files() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState([]);
  const fileInputRef = useRef(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [fileError, setFileError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    get("/projects")
      .then((response) => {
        if (active) {
          setProjects(Array.isArray(response?.data) ? response.data : []);
          setProjectError("");
        }
      })
      .catch((error) => {
        if (active) setProjectError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!projectId) return () => { active = false; };

    get("/files?resourceType=PROJECT&resourceId=" + encodeURIComponent(projectId))
      .then((response) => {
        if (active) {
          setItems(Array.isArray(response?.data) ? response.data : []);
          setFileError("");
        }
      })
      .catch((error) => {
        if (active) setFileError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingFiles(false);
      });
    return () => { active = false; };
  }, [projectId, version]);

  function chooseProject(value) {
    setProjectId(value);
    setItems([]);
    setSelectedFile(null);
    setFileError("");
    setNotice("");
    setLoadingFiles(Boolean(value));
  }

  function validateFile(file) {
    if (!file) return "Choose a document to upload.";
    if (file.size > 10 * 1024 * 1024) return "File must not exceed 10 MB.";
    if (file.size === 0) return "The selected file is empty.";
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!extensions.has(ext)) return "Unsupported document format.";
    return "";
  }

  async function submit(event) {
    event.preventDefault();
    if (!projectId) return setNotice("Select a project first.");

    const error = validateFile(selectedFile);
    if (error) return setNotice(error);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("resourceType", "PROJECT");
    formData.append("resourceId", projectId);

    setUploading(true);
    setNotice("");
    try {
      const response = await upload("/files", formData);
      if (response?.data) setItems((current) => [response.data, ...current]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice("File uploaded.");
    } catch (reason) {
      setNotice(apiErrorMessage(reason));
    } finally {
      setUploading(false);
    }
  }

  async function remove(item) {
    if (!window.confirm("Permanently remove this file?")) return;
    setDeletingId(item.id);
    setNotice("");
    try {
      await del("/files/" + item.id);
      setItems((current) => current.filter((file) => file.id !== item.id));
      setNotice("File deleted.");
    } catch (error) {
      setNotice(apiErrorMessage(error));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="files-page">
      <section className="files-header">
        <div>
          <p className="files-eyebrow">COMPANY FILES</p>
          <h1>Keep the documents connected to the work.</h1>
          <p className="files-intro">
            Select a project to browse its documents or attach a new file.
            Only supported document and image types up to 10 MB can be uploaded.
          </p>
        </div>
        <div className="files-context">
          <span className="files-context-label">SCOPE</span>
          <strong>Project files</strong>
        </div>
      </section>

      <section className="files-section">
        <div className="files-section-header">
          <div>
            <p className="files-section-kicker">DOCUMENTS & RESOURCES</p>
            <h2>Files</h2>
          </div>
          <button type="button" className="workspace-action workspace-action--secondary"
            disabled={!projectId || loadingFiles}
            onClick={() => { setLoadingFiles(true); setVersion((number) => number + 1); }}>
            Refresh files
          </button>
        </div>

        {loadingProjects && <p className="workspace-feedback" role="status">Loading projects...</p>}
        {!loadingProjects && projectError && <p className="workspace-feedback" role="alert">{projectError}</p>}
        {!loadingProjects && !projectError && (
          <div className="workspace-field">
            <label htmlFor="files-project">Select a project</label>
            <select id="files-project" value={projectId} onChange={(event) => chooseProject(event.target.value)}>
              <option value="">Choose a project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
        )}
        {notice && <p className="workspace-feedback" role="status">{notice}</p>}

        {projectId && (
          <>
            <form className="workspace-data-form" onSubmit={submit}>
              <div className="workspace-field workspace-field--wide">
                <label htmlFor="files-upload">Upload document or image</label>
                <input id="files-upload" ref={fileInputRef} type="file" required disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] || null);
                    setNotice("");
                  }}
                />
              </div>
              <div className="workspace-actions">
                <button className="workspace-action" type="submit" disabled={uploading || !selectedFile}>
                  {uploading ? "Uploading..." : "Upload file"}
                </button>
              </div>
            </form>

            {loadingFiles && <p className="workspace-feedback" role="status">Loading files...</p>}
            {!loadingFiles && fileError && <p className="workspace-feedback" role="alert">{fileError}</p>}
            {!loadingFiles && !fileError && items.length === 0 && (
              <p className="workspace-feedback">No project files have been uploaded yet.</p>
            )}
            {!loadingFiles && !fileError && (
              <div className="workspace-data-list">
                {items.map((file) => (
                  <article className="workspace-data-item" key={file.id}>
                    <div className="workspace-data-row">
                      <div>
                        <h3>{file.original_name}</h3>
                        <div className="workspace-data-meta">
                          <span>{Math.ceil(file.size_bytes / 1024)} KB</span>
                          <span>{new Date(file.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="workspace-actions">
                        <a className="workspace-action" href={API_BASE_URL + "/files/" + file.id + "/download"}>
                          Download
                        </a>
                        <button className="workspace-action workspace-action--secondary" type="button"
                          disabled={deletingId === file.id} onClick={() => remove(file)}>
                          {deletingId === file.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {!projectId && !loadingProjects && !projectError && projects.length === 0 && (
          <p className="workspace-feedback">Create a project before attaching documents.</p>
        )}
      </section>
    </main>
  );
}

export default Files;
