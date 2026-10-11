import "./Updates.css";

function Updates() {
  return (
    <div className="updates-page">
      <header className="updates-header">
        <div>
          <p className="updates-kicker">COMPANY COMMUNICATION</p>

          <h1>
            Updates
            <span> keep the company informed.</span>
          </h1>

          <p className="updates-intro">
            Progress reports, important changes, blockers, and requests stay
            connected to the work they describe so people can understand what
            is happening without reconstructing the story themselves.
          </p>
        </div>

        <button type="button" className="updates-create-button">
          Post update
        </button>
      </header>

      <section className="updates-stream">
        <div className="updates-section-heading">
          <div>
            <p className="updates-section-kicker">COMPANY UPDATES</p>

            <h2>
              Information from the people
              <span> doing the work.</span>
            </h2>
          </div>

          <span className="updates-section-index">01</span>
        </div>

        <div className="updates-empty-state">
          <div className="updates-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No updates have been posted.</strong>

            <p>
              Updates will appear here according to the signed-in user's
              permissions and company scope.
            </p>
          </div>
        </div>
      </section>

      <section className="updates-types">
        <div className="updates-section-heading">
          <div>
            <p className="updates-section-kicker">WHAT STAYS CONNECTED</p>

            <h2>
              Communication should have
              <span> somewhere useful to land.</span>
            </h2>
          </div>

          <span>02</span>
        </div>

        <div className="updates-types-list">
          <div className="updates-type-row">
            <span>PROGRESS</span>

            <div>
              <strong>What has changed since the last update.</strong>

              <p>
                Written progress can remain attached to the project or work it
                describes.
              </p>
            </div>
          </div>

          <div className="updates-type-row">
            <span>BLOCKERS</span>

            <div>
              <strong>What is preventing work from moving forward.</strong>

              <p>
                Blockers can stay connected to the responsibility or project
                that needs attention.
              </p>
            </div>
          </div>

          <div className="updates-type-row">
            <span>REQUESTS</span>

            <div>
              <strong>What someone needs from the company or another person.</strong>

              <p>
                Requests can remain visible in the context of the work they
                affect.
              </p>
            </div>
          </div>

          <div className="updates-type-row">
            <span>DECISIONS</span>

            <div>
              <strong>Important communication around operational changes.</strong>

              <p>
                Meaningful decisions should remain understandable alongside
                the work they influence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="updates-principle">
        <div className="updates-principle-label">
          <span>MANAGEOS PRINCIPLE</span>
        </div>

        <div>
          <h2>
            The update should tell
            <span> the useful part of the story.</span>
          </h2>

          <p>
            ManageOS is not intended to become a noisy social feed. The value
            of an update comes from its relationship to the work, the people
            responsible for it, and the decisions or results that follow.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Updates;