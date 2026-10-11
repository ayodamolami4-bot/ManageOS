import "./Work.css";

function Work() {
  return (
    <div className="work-page">
      <header className="work-header">
        <div>
          <p className="work-kicker">EXECUTION</p>

          <h1>
            Work
            <span> where responsibility becomes visible.</span>
          </h1>

          <p className="work-intro">
            See the work assigned across the company, understand its current
            state, and keep progress connected to the projects and people
            responsible for it.
          </p>
        </div>

        <button type="button" className="work-create-button">
          Create work
        </button>
      </header>

      <section className="work-state-section">
        <div className="work-section-heading">
          <div>
            <p className="work-section-kicker">WORK STATE</p>

            <h2>
              Understand what is
              <span> happening with the work.</span>
            </h2>
          </div>

          <span className="work-section-index">01</span>
        </div>

        <div className="work-state-grid">
          <article className="work-state-item work-state-green">
            <span>ASSIGNED</span>

            <strong>No assigned work yet.</strong>

            <p>
              Newly assigned work will appear here with its owner and project
              context.
            </p>
          </article>

          <article className="work-state-item work-state-copper">
            <span>IN PROGRESS</span>

            <strong>No active work yet.</strong>

            <p>
              Work currently being carried out will appear here with its
              latest available progress information.
            </p>
          </article>

          <article className="work-state-item work-state-lime">
            <span>REVIEW</span>

            <strong>No work awaiting review.</strong>

            <p>
              Submitted work requiring an authorized review will appear here.
            </p>
          </article>

          <article className="work-state-item work-state-sky">
            <span>RESULT</span>

            <strong>No completed work yet.</strong>

            <p>
              Completed work and its recorded outcomes will remain connected to
              the history of the work.
            </p>
          </article>
        </div>
      </section>

      <section className="work-register">
        <div className="work-section-heading">
          <div>
            <p className="work-section-kicker">WORK REGISTER</p>

            <h2>Responsibilities moving through the company.</h2>
          </div>

          <span>00</span>
        </div>

        <div className="work-empty-state">
          <div className="work-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No work has been created or assigned.</strong>

            <p>
              Tasks and other pieces of work will appear here according to the
              signed-in user's permissions and company scope.
            </p>
          </div>
        </div>
      </section>

      <section className="work-model">
        <div className="work-model-heading">
          <p className="work-section-kicker">WORK CONTEXT</p>

          <h2>
            A piece of work should
            <span> tell you where it belongs.</span>
          </h2>
        </div>

        <div className="work-model-list">
          <div className="work-model-row">
            <span>PROJECT</span>
            <strong>The larger outcome the work contributes to.</strong>
          </div>

          <div className="work-model-row">
            <span>MILESTONE</span>
            <strong>The stage or checkpoint the work supports.</strong>
          </div>

          <div className="work-model-row">
            <span>OWNER</span>
            <strong>The person responsible for moving the work forward.</strong>
          </div>

          <div className="work-model-row">
            <span>UPDATE</span>
            <strong>The current information about the work.</strong>
          </div>

          <div className="work-model-row">
            <span>REVIEW</span>
            <strong>The authorized response to submitted work.</strong>
          </div>

          <div className="work-model-row">
            <span>RESULT</span>
            <strong>The outcome connected to what was done.</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Work;