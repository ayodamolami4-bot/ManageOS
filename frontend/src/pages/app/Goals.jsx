import WorkRecordManager from "../../components/WorkRecordManager";
import "./Goals.css";

function Goals() {
  return (
    <div className="goals-page">
      <header className="goals-header">
        <div>
          <p className="goals-kicker">COMPANY DIRECTION</p>
          <h1>Goals<span> give the work direction.</span></h1>
          <p className="goals-intro">
            Define the outcomes your company wants to achieve, give them a
            priority and track the dates and status as the work progresses.
          </p>
        </div>
      </header>

      <section className="goals-overview" aria-label="How company goals work">
        <div className="goals-overview-item">
          <span>DIRECTION</span>
          <strong>Define outcomes</strong>
          <p>Write a concrete objective and describe what success means.</p>
        </div>
        <div className="goals-overview-item">
          <span>ACCOUNTABILITY</span>
          <strong>Track status</strong>
          <p>Keep the latest status, priority and target date visible.</p>
        </div>
        <div className="goals-overview-item">
          <span>CONNECTION</span>
          <strong>Connect work</strong>
          <p>Goals provide context for the projects that follow.</p>
        </div>
      </section>

      <section className="goals-list-section">
        <WorkRecordManager kind="goal" />
      </section>
    </div>
  );
}

export default Goals;
