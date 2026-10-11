import EventRecordList from "../../components/EventRecordList";
import "./Audit.css";

function Audit() {
  return (
    <main className="audit-page">
      <section className="audit-header">
        <div>
          <p className="audit-eyebrow">FORMAL RECORD</p>
          <h1>Audit records what changed, who changed it, and when.</h1>
          <p className="audit-intro">
            Audit is a controlled accountability record, distinct from
            company activity. The backend enforces audit.view permission and
            company isolation before returning events.
          </p>
        </div>
        <div className="audit-context">
          <span className="audit-context-label">ACCESS</span>
          <strong>Permission restricted</strong>
        </div>
      </section>

      <section className="audit-notice">
        <div className="audit-notice-mark">!</div>
        <div>
          <h2>Restricted company records</h2>
          <p>Detailed changes appear only when the signed-in account has audit access.</p>
        </div>
      </section>
      <section className="audit-section">
        <EventRecordList kind="audit" />
      </section>
    </main>
  );
}

export default Audit;
