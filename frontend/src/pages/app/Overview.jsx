import "./Overview.css";

function Overview() {
  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <p className="overview-kicker">COMPANY OVERVIEW</p>

          <h1>
            See what is happening
            <span> across the company.</span>
          </h1>

          <p className="overview-intro">
            A connected view of company direction, work, updates, results, and
            operational history.
          </p>
        </div>

        <div className="overview-header-state">
          <span />
          <div>
            <strong>Workspace ready</strong>
            <small>Live company data will appear here.</small>
          </div>
        </div>
      </header>

      <section className="overview-direction">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">DIRECTION</p>
            <h2>What the company is trying to achieve.</h2>
          </div>

          <span className="overview-section-index">01</span>
        </div>

        <div className="overview-empty-panel overview-direction-panel">
          <div className="overview-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No company goals yet.</strong>

            <p>
              Goals created for the company or its organization units will
              appear here and provide direction for the work that follows.
            </p>
          </div>
        </div>
      </section>

      <section className="overview-work">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">WORK</p>
            <h2>What is moving and what needs attention.</h2>
          </div>

          <span className="overview-section-index">02</span>
        </div>

        <div className="overview-work-grid">
          <article className="overview-work-panel overview-work-panel-green">
            <span className="overview-panel-label">PROJECTS</span>

            <strong>Nothing active yet.</strong>

            <p>
              Active projects will give management and authorized users a
              company-level view of work in motion.
            </p>
          </article>

          <article className="overview-work-panel overview-work-panel-copper">
            <span className="overview-panel-label">ATTENTION</span>

            <strong>No items requiring attention.</strong>

            <p>
              Blockers, requests, pending reviews, and other operational
              signals will surface here when they exist.
            </p>
          </article>

          <article className="overview-work-panel overview-work-panel-lime">
            <span className="overview-panel-label">UPDATES</span>

            <strong>No updates yet.</strong>

            <p>
              Progress reports and important project communication will appear
              here as work moves forward.
            </p>
          </article>
        </div>
      </section>

      <section className="overview-record">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">OPERATIONAL RECORD</p>
            <h2>Changes should remain understandable.</h2>
          </div>

          <span className="overview-section-index">03</span>
        </div>

        <div className="overview-record-panel">
          <div className="overview-record-top">
            <div>
              <span className="overview-panel-label">ACTIVITY</span>
              <h3>Company activity will appear here.</h3>
            </div>

            <span className="overview-record-access">
              Authorized access
            </span>
          </div>

          <div className="overview-record-empty">
            <div className="overview-record-line">
              <span />
            </div>

            <div>
              <strong>No activity recorded yet.</strong>

              <p>
                As people create work, submit updates, review results, and make
                operational changes, authorized activity will become part of
                the company record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overview-responsibility">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-kicker">RESPONSIBILITY</p>
            <h2>Work should be clear to the people responsible for it.</h2>
          </div>

          <span className="overview-section-index">04</span>
        </div>

        <div className="overview-responsibility-panel">
          <div className="overview-responsibility-item">
            <span>YOUR WORK</span>
            <strong>No assigned work yet.</strong>
            <p>
              Tasks and responsibilities assigned to the signed-in user will
              appear here.
            </p>
          </div>

          <div className="overview-responsibility-item">
            <span>YOUR UPDATES</span>
            <strong>No progress updates yet.</strong>
            <p>
              Written progress reports submitted by the signed-in user will be
              accessible from the workspace.
            </p>
          </div>

          <div className="overview-responsibility-item">
            <span>YOUR REQUESTS</span>
            <strong>No requests yet.</strong>
            <p>
              Blockers and operational requests connected to the user's work
              will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Overview;