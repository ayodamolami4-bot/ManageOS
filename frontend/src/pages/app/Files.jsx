import "./Files.css";

function Files() {
  return (
    <main className="files-page">
      <section className="files-header">
        <div>
          <p className="files-eyebrow">COMPANY FILES</p>
          <h1>Keep the documents connected to the work.</h1>
          <p className="files-intro">
            Files gives the company a shared place for documents and other
            resources attached to goals, projects, work, updates, and
            discussions.
          </p>
        </div>

        <div className="files-context">
          <span className="files-context-label">SCOPE</span>
          <strong>Company workspace</strong>
        </div>
      </section>

      <section className="files-section">
        <div className="files-section-header">
          <div>
            <p className="files-section-kicker">DOCUMENTS & RESOURCES</p>
            <h2>Files</h2>
          </div>

          <button type="button" className="files-upload-button">
            Upload file
          </button>
        </div>

        <div className="files-empty">
          <div className="files-empty-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h3>No files have been added yet.</h3>

          <p>
            Company files will appear here as people attach documents and
            resources to the work they are responsible for.
          </p>
        </div>
      </section>

      <section className="files-guidance">
        <div className="files-guidance-item">
          <span className="files-guidance-number">01</span>

          <div>
            <h3>Keep context attached</h3>
            <p>
              Files should remain connected to the goal, project, work, update,
              or discussion where they are needed.
            </p>
          </div>
        </div>

        <div className="files-guidance-item">
          <span className="files-guidance-number">02</span>

          <div>
            <h3>Respect access</h3>
            <p>
              A file should only be visible to people who are authorized to
              access its related company resource.
            </p>
          </div>
        </div>

        <div className="files-guidance-item">
          <span className="files-guidance-number">03</span>

          <div>
            <h3>Preserve the record</h3>
            <p>
              File actions should remain connected to the operational and
              audit history of the company.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Files;