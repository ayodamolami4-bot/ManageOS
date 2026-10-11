import EventRecordList from "../../components/EventRecordList";
import "./Activity.css";

function Activity() {
  return (
    <main className="activity-page">
      <section className="activity-header">
        <div>
          <p className="activity-eyebrow">COMPANY ACTIVITY</p>
          <h1>See what is happening across the company.</h1>
          <p className="activity-intro">
            An operational timeline of important company changes, shown only
            when your account has permission to view company activity.
          </p>
        </div>
      </section>
      <section className="activity-section">
        <EventRecordList kind="activity" />
      </section>
    </main>
  );
}

export default Activity;
