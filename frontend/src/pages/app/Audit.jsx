import "./Audit.css";

function Audit() {
  return (
    <main className="audit-page">
      <section className="audit-header">
        <div>
          <p className="audit-eyebrow">FORMAL RECORD</p>
          <h1>Audit records what changed, who changed it, and when.</h1>
          <p className="audit-intro">
            Audit is the controlled accountability record for important
            actions across the company. It is not a social feed or general
            activity stream.
          </p>
        </div>

        <div className="audit-context">
          <span className="audit-context-label">ACCESS</span>
          <strong>Controlled record</strong>
        </div>
      </section>

      <section className="audit-notice">
        <div className="audit-notice-mark">!</div>

        <div>
          <h2>Access follows authorization</h2>
          <p>
            Audit visibility will be determined by the permissions attached to
            the signed-in user. The frontend will only expose records the
            backend authorizes.
          </p>
        </div>
      </section>

      <section className="audit-section">
        <div className="audit-section-header">
          <div>
            <p className="audit-section-kicker">ACCOUNTABILITY</p>
            <h2>Audit record</h2>
          </div>
        </div>

        <div className="audit-table">
          <div className="audit-table-header">
            <span>EVENT</span>
            <span>ACTOR</span>
            <span>RESOURCE</span>
            <span>TIME</span>
          </div>

          <div className="audit-empty">
            <h3>No audit records yet.</h3>

            <p>
              Formal system events will appear here once the company has
              recorded auditable actions.
            </p>
          </div>
        </div>
      </section>

      <section className="audit-guidance">
        <div className="audit-guidance-item">
          <span className="audit-guidance-number">01</span>

          <div>
            <h3>What happened</h3>
            <p>
              The record should identify the meaningful action performed, not
              every minor interface interaction.
            </p>
          </div>
        </div>

        <div className="audit-guidance-item">
          <span className="audit-guidance-number">02</span>

          <div>
            <h3>Who performed it</h3>
            <p>
              The responsible user should be identifiable through the
              authenticated company account behind the event.
            </p>
          </div>
        </div>

        <div className="audit-guidance-item">
          <span className="audit-guidance-number">03</span>

          <div>
            <h3>What it affected</h3>
            <p>
              Important changes should retain enough context to understand the
              affected company resource and its history.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Audit;