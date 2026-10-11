import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./HowItWorks.css";

function HowItWorks() {
  return (
    <PublicLayout>
      <section className="how-page">
        <section className="how-hero">
          <div className="how-hero-copy">
            <p className="how-kicker">HOW MANAGEOS WORKS</p>

            <h1>
              From company goals
              <span> to visible results.</span>
            </h1>

            <p className="how-hero-text">
              ManageOS connects the different parts of company operations so
              people can understand what needs to happen, who is responsible,
              what is changing, and what has been completed.
            </p>

            <div className="how-hero-actions">
              <Link to="/register" className="how-primary-button">
                Create your workspace
              </Link>

              <Link to="/product" className="how-secondary-button">
                Explore the product
              </Link>
            </div>
          </div>

          <div className="how-hero-flow">
            <div className="how-flow-top">
              <span>COMPANY FLOW</span>
              <strong>Work stays connected</strong>
            </div>

            <div className="how-flow-item">
              <span>01</span>
              <div>
                <strong>Goals</strong>
                <p>What is the company trying to achieve?</p>
              </div>
            </div>

            <div className="how-flow-connector" />

            <div className="how-flow-item">
              <span>02</span>
              <div>
                <strong>Organization</strong>
                <p>How is responsibility arranged?</p>
              </div>
            </div>

            <div className="how-flow-connector" />

            <div className="how-flow-item">
              <span>03</span>
              <div>
                <strong>Projects</strong>
                <p>What work is moving the goal forward?</p>
              </div>
            </div>

            <div className="how-flow-connector" />

            <div className="how-flow-item">
              <span>04</span>
              <div>
                <strong>Updates</strong>
                <p>What is happening, blocked, or changing?</p>
              </div>
            </div>

            <div className="how-flow-connector" />

            <div className="how-flow-item">
              <span>05</span>
              <div>
                <strong>Results</strong>
                <p>What was completed, submitted, or reviewed?</p>
              </div>
            </div>

            <div className="how-flow-connector" />

            <div className="how-flow-item how-flow-final">
              <span>06</span>
              <div>
                <strong>Audit</strong>
                <p>What should remain part of the company record?</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-explanation">
          <div className="how-section-heading">
            <p className="how-section-kicker">THE IDEA</p>

            <h2>
              The company should not have to
              <span> reconstruct the story.</span>
            </h2>
          </div>

          <div className="how-explanation-copy">
            <p>
              Important operational information often ends up spread across
              conversations, documents, spreadsheets, meetings, and separate
              tools.
            </p>

            <p>
              ManageOS gives that information a connected structure. A goal can
              lead to a project. A project can contain work. Work can generate
              updates and submissions. Results can be reviewed, while important
              changes remain part of the operational history.
            </p>
          </div>
        </section>

        <section className="how-steps">
          <div className="how-steps-heading">
            <p className="how-section-kicker">THE PROCESS</p>

            <h2>
              Six parts.
              <span> One operational picture.</span>
            </h2>
          </div>

          <div className="how-step-list">
            <article className="how-step-row how-step-green">
              <div className="how-step-index">01</div>

              <div className="how-step-main">
                <h3>Set goals</h3>

                <p>
                  Management establishes the objectives that give the company
                  a direction and create context for the work that follows.
                </p>
              </div>

              <div className="how-step-label">DIRECTION</div>
            </article>

            <article className="how-step-row how-step-copper">
              <div className="how-step-index">02</div>

              <div className="how-step-main">
                <h3>Organize the company</h3>

                <p>
                  Create flexible organizational units, memberships, and
                  responsibilities around how the company actually operates.
                </p>
              </div>

              <div className="how-step-label">STRUCTURE</div>
            </article>

            <article className="how-step-row how-step-lime">
              <div className="how-step-index">03</div>

              <div className="how-step-main">
                <h3>Create projects and work</h3>

                <p>
                  Turn objectives into projects, milestones, and tasks so work
                  has a clear place, owner, and relationship to the wider goal.
                </p>
              </div>

              <div className="how-step-label">EXECUTION</div>
            </article>

            <article className="how-step-row how-step-sky">
              <div className="how-step-index">04</div>

              <div className="how-step-main">
                <h3>Keep everyone informed</h3>

                <p>
                  Employees and leads can provide progress updates, communicate
                  directly, raise blockers, submit requests, and discuss the
                  work in context.
                </p>
              </div>

              <div className="how-step-label">COMMUNICATION</div>
            </article>

            <article className="how-step-row how-step-green">
              <div className="how-step-index">05</div>

              <div className="how-step-main">
                <h3>Review the result</h3>

                <p>
                  Completed work can be submitted and reviewed so the company
                  has a clearer distinction between assigned work and verified
                  results.
                </p>
              </div>

              <div className="how-step-label">REVIEW</div>
            </article>

            <article className="how-step-row how-step-copper">
              <div className="how-step-index">06</div>

              <div className="how-step-main">
                <h3>Keep the history</h3>

                <p>
                  Important actions and changes become part of the operational
                  record, preserving context around what happened.
                </p>
              </div>

              <div className="how-step-label">AUDIT</div>
            </article>
          </div>
        </section>

        <section className="how-accountability">
          <div className="how-accountability-copy">
            <p className="how-section-kicker">ACCOUNTABILITY</p>

            <h2>
              Visibility without
              <span> unnecessary surveillance.</span>
            </h2>

            <p>
              ManageOS is built around communication, responsibility, and
              meaningful operational history. The purpose is to understand the
              work, not to turn the company into a time-tracking system.
            </p>
          </div>

          <div className="how-accountability-panel">
            <div className="how-accountability-item">
              <span>01</span>

              <div>
                <strong>Ownership</strong>
                <p>Work has a clear place and responsible person.</p>
              </div>
            </div>

            <div className="how-accountability-item">
              <span>02</span>

              <div>
                <strong>Context</strong>
                <p>Updates remain connected to the work they describe.</p>
              </div>
            </div>

            <div className="how-accountability-item">
              <span>03</span>

              <div>
                <strong>Review</strong>
                <p>Results can move through a defined review process.</p>
              </div>
            </div>

            <div className="how-accountability-item">
              <span>04</span>

              <div>
                <strong>History</strong>
                <p>Important changes remain traceable through records.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-roles">
          <div className="how-roles-heading">
            <p className="how-section-kicker">ROLES</p>

            <h2>
              The same work.
              <span> Different responsibility.</span>
            </h2>
          </div>

          <div className="how-role-list">
            <div className="how-role">
              <span>Management</span>

              <p>
                Set direction, oversee company progress, review work, and keep
                the wider operation visible.
              </p>
            </div>

            <div className="how-role">
              <span>Team leads</span>

              <p>
                Coordinate project work, guide employees, review submissions,
                and keep assigned projects moving.
              </p>
            </div>

            <div className="how-role">
              <span>Employees</span>

              <p>
                Work on assigned responsibilities, provide updates, raise
                blockers, and communicate around the work.
              </p>
            </div>
          </div>
        </section>

        <section className="how-example">
          <div className="how-example-copy">
            <p className="how-section-kicker">AN EXAMPLE</p>

            <h2>
              A company goal becomes
              <span> something people can act on.</span>
            </h2>

            <p>
              Instead of leaving an objective as a statement in a meeting or
              document, ManageOS connects it to the operational work required
              to move it forward.
            </p>
          </div>

          <div className="how-example-chain">
            <div>
              <span>GOAL</span>
              <strong>What needs to happen?</strong>
            </div>

            <span className="how-chain-arrow">→</span>

            <div>
              <span>PROJECT</span>
              <strong>What work will move it forward?</strong>
            </div>

            <span className="how-chain-arrow">→</span>

            <div>
              <span>ASSIGNMENT</span>
              <strong>Who owns the work?</strong>
            </div>

            <span className="how-chain-arrow">→</span>

            <div>
              <span>UPDATE</span>
              <strong>What is happening?</strong>
            </div>

            <span className="how-chain-arrow">→</span>

            <div>
              <span>RESULT</span>
              <strong>What was completed?</strong>
            </div>
          </div>
        </section>

        <section className="how-closing">
          <p className="how-section-kicker">MAKE THE WORK VISIBLE</p>

          <h2>
            Give the company a clearer
            <span> way to operate.</span>
          </h2>

          <Link to="/register" className="how-closing-button">
            Create your workspace
          </Link>
        </section>
      </section>
    </PublicLayout>
  );
}

export default HowItWorks;