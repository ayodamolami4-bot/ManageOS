import "./Activity.css";

function Activity() {
  return (
    <main className="activity-page">
      <section className="activity-header">
        <div>
          <p className="activity-eyebrow">COMPANY ACTIVITY</p>
          <h1>See what is happening across the company.</h1>
          <p className="activity-intro">
            Activity gives the company a shared operational record of important
            work, updates, decisions, and changes.
          </p>
        </div>

        <div className="activity-context">
          <span className="activity-context-label">VIEW</span>
          <strong>Company activity</strong>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-section-header">
          <div>
            <p className="activity-section-kicker">OPERATIONAL RECORD</p>
            <h2>Recent activity</h2>
          </div>
        </div>

        <div className="activity-empty">
          <div className="activity-empty-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h3>Nothing has been recorded yet.</h3>

          <p>
            Important company activity will appear here as goals, projects,
            work, updates, discussions, and other operational events happen.
          </p>
        </div>
      </section>

      <section className="activity-guidance">
        <div className="activity-guidance-item">
          <span className="activity-guidance-number">01</span>
          <div>
            <h3>Operational context</h3>
            <p>
              Activity should explain what changed and where it happened,
              rather than becoming a stream of every small system event.
            </p>
          </div>
        </div>

        <div className="activity-guidance-item">
          <span className="activity-guidance-number">02</span>
          <div>
            <h3>Useful history</h3>
            <p>
              The record should help people understand how work moved from
              direction to action, update, decision, and result.
            </p>
          </div>
        </div>

        <div className="activity-guidance-item">
          <span className="activity-guidance-number">03</span>
          <div>
            <h3>Access follows responsibility</h3>
            <p>
              People should only see activity that belongs to the company
              context and work they are authorized to access.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Activity;