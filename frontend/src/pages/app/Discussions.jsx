import "./Discussions.css";

function Discussions() {
  return (
    <div className="discussions-page">
      <header className="discussions-header">
        <div>
          <p className="discussions-kicker">WORK COMMUNICATION</p>

          <h1>
            Discussions
            <span> keep conversation with the work.</span>
          </h1>

          <p className="discussions-intro">
            Talk around projects, responsibilities, decisions, and issues
            without separating the conversation from the work it concerns.
          </p>
        </div>

        <button type="button" className="discussions-create-button">
          Start discussion
        </button>
      </header>

      <section className="discussions-stream">
        <div className="discussions-section-heading">
          <div>
            <p className="discussions-section-kicker">DISCUSSION SPACE</p>

            <h2>
              Conversation with
              <span> useful context.</span>
            </h2>
          </div>

          <span className="discussions-section-index">01</span>
        </div>

        <div className="discussions-empty-state">
          <div className="discussions-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No discussions have been started.</strong>

            <p>
              Discussions will appear here according to the signed-in user's
              permissions and company scope.
            </p>
          </div>
        </div>
      </section>

      <section className="discussions-types">
        <div className="discussions-section-heading">
          <div>
            <p className="discussions-section-kicker">
              WHERE CONVERSATION BELONGS
            </p>

            <h2>
              Keep the conversation
              <span> close to the decision.</span>
            </h2>
          </div>

          <span>02</span>
        </div>

        <div className="discussions-types-list">
          <div className="discussions-type-row">
            <span>PROJECT</span>

            <div>
              <strong>Discuss the work a project needs to move forward.</strong>

              <p>
                Project conversations can remain connected to milestones,
                responsibilities, updates, and results.
              </p>
            </div>
          </div>

          <div className="discussions-type-row">
            <span>WORK</span>

            <div>
              <strong>Talk directly around a responsibility.</strong>

              <p>
                People can discuss assigned work without losing the context of
                what the work is meant to accomplish.
              </p>
            </div>
          </div>

          <div className="discussions-type-row">
            <span>DECISION</span>

            <div>
              <strong>Keep important operational decisions understandable.</strong>

              <p>
                Discussion can preserve the reasoning and context around a
                change that affects company work.
              </p>
            </div>
          </div>

          <div className="discussions-type-row">
            <span>GENERAL</span>

            <div>
              <strong>Discuss company matters that need a shared place.</strong>

              <p>
                General discussions can exist where appropriate without making
                the entire application into a social feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="discussions-principle">
        <div className="discussions-principle-label">
          <span>MANAGEOS PRINCIPLE</span>
        </div>

        <div>
          <h2>
            Conversation should
            <span> add context, not noise.</span>
          </h2>

          <p>
            ManageOS gives communication a place inside the operational system.
            A useful discussion should help people understand the work,
            resolve an issue, make a decision, or keep the right people
            informed.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Discussions;