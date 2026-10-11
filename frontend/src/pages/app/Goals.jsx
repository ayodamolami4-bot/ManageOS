import "./Goals.css";

function Goals() {
  return (
    <div className="goals-page">
      <header className="goals-header">
        <div>
          <p className="goals-kicker">COMPANY DIRECTION</p>

          <h1>
            Goals
            <span> give the work direction.</span>
          </h1>

          <p className="goals-intro">
            Define what the company, an organization unit, or a project is
            trying to achieve, then connect the work that moves it forward.
          </p>
        </div>

        <button type="button" className="goals-create-button">
          Create goal
        </button>
      </header>

      <section className="goals-overview">
        <div className="goals-overview-item">
          <span>COMPANY GOALS</span>
          <strong>No goals yet</strong>
          <p>
            Company-level objectives will appear here once they are created.
          </p>
        </div>

        <div className="goals-overview-item">
          <span>ORGANIZATION GOALS</span>
          <strong>No goals yet</strong>
          <p>
            Goals assigned to organization units will appear here.
          </p>
        </div>

        <div className="goals-overview-item">
          <span>PROJECT ALIGNMENT</span>
          <strong>No connected work yet</strong>
          <p>
            Projects and work connected to goals will become visible here.
          </p>
        </div>
      </section>

      <section className="goals-list-section">
        <div className="goals-section-heading">
          <div>
            <p className="goals-section-kicker">GOAL REGISTER</p>
            <h2>Direction for the company.</h2>
          </div>

          <span>00</span>
        </div>

        <div className="goals-empty-state">
          <div className="goals-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No goals have been created.</strong>

            <p>
              Goals will become the starting point for connected projects,
              responsibilities, updates, results, and operational history.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Goals;