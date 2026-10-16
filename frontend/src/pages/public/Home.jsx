import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./Home.css";

function Home() {
  return (
    <PublicLayout>
      <div className="home-page">
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-symbol" aria-hidden="true">
              <span className="home-symbol-green" />
              <span className="home-symbol-copper" />
              <span className="home-symbol-lime" />
            </div>

            <span className="home-kicker">
              Company operations, connected.
            </span>

            <h1>
              Keep the work
              <br />
              moving.
              <br />
              <em>Keep the company informed.</em>
            </h1>

            <p className="home-hero-description">
              ManageOS connects company goals, organization, projects, work,
              updates, results, and audit history into one operating record.
              Built for companies across industries, not one way of working.
            </p>

            <div className="home-actions">
              <Link to="/register" className="home-primary">
                Create your workspace
              </Link>

              <Link to="/demo" className="home-secondary">
                Explore the live demo
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="home-process">
              <span className="home-process-line" />
              <span>Goals → Work → Updates → Results → Record</span>
            </div>
          </div>

          <div className="home-product-preview">
            <div className="home-preview-caption">
              <span>ManageOS workspace</span>
              <span>Company operating view</span>
            </div>

            <div className="home-preview-window">
              <div className="home-preview-top">
                <span>Company overview</span>
                <span>Operational view</span>
              </div>

              <div className="home-preview-body">
                <div className="home-preview-heading">
                  <div>
                    <span className="home-preview-label">
                      Company activity
                    </span>

                    <h2>Work at a glance.</h2>
                  </div>

                  <span className="home-preview-status">
                    <span />
                    Connected
                  </span>
                </div>

                <div className="home-preview-grid">
                  <div className="home-preview-block home-preview-main-block">
                    <span className="home-preview-label">Current focus</span>

                    <strong>Work in motion</strong>

                    <p>
                      See what is moving, what needs attention, and what has
                      recently changed across the company.
                    </p>

                    <div className="home-preview-progress">
                      <span />
                    </div>
                  </div>

                  <div className="home-preview-side">
                    <div>
                      <span>Projects</span>
                      <strong>Active</strong>
                    </div>

                    <div>
                      <span>Reviews</span>
                      <strong>Pending</strong>
                    </div>

                    <div>
                      <span>Updates</span>
                      <strong>Current</strong>
                    </div>
                  </div>
                </div>

                <div className="home-preview-divider" />

                <div className="home-preview-project">
                  <div>
                    <span className="home-preview-label">Work in context</span>

                    <h3>Company work moves through a visible process.</h3>

                    <p>
                      Assigned work, progress updates, discussions,
                      submissions, reviews, and results stay connected.
                    </p>
                  </div>

                  <div className="home-preview-progress-block">
                    <span>Progress</span>

                    <div>
                      <span />
                    </div>
                  </div>
                </div>

                <div className="home-preview-events">
                  <div className="home-preview-event">
                    <span className="preview-dot preview-green" />

                    <div>
                      <strong>Work assigned</strong>
                      <span>Responsibility established</span>
                    </div>
                  </div>

                  <div className="home-preview-event">
                    <span className="preview-dot preview-copper" />

                    <div>
                      <strong>Update received</strong>
                      <span>Progress added to the record</span>
                    </div>
                  </div>

                  <div className="home-preview-event">
                    <span className="preview-dot preview-sky" />

                    <div>
                      <strong>Review activity</strong>
                      <span>Change remains visible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="home-operation-rail">
              <span className="home-rail-title">Work state</span>

              <div className="home-rail-step complete">
                <span />

                <div>
                  <strong>Assigned</strong>
                  <span>Owner established</span>
                </div>
              </div>

              <div className="home-rail-step current">
                <span />

                <div>
                  <strong>In progress</strong>
                  <span>Work is moving</span>
                </div>
              </div>

              <div className="home-rail-step">
                <span />

                <div>
                  <strong>Review</strong>
                  <span>Submission received</span>
                </div>
              </div>

              <div className="home-rail-step">
                <span />

                <div>
                  <strong>Result</strong>
                  <span>Outcome recorded</span>
                </div>
              </div>
            </div>

            <div className="home-preview-captions">
              <span>Work</span>
              <span>Change</span>
              <span>Progress</span>
            </div>
          </div>
        </section>

        <section className="home-statement">
          <span>Goals</span>
          <span>Organization</span>
          <span>Projects</span>
          <span>Work</span>
          <span>Updates</span>
          <span>Results</span>
          <span>Audit</span>
        </section>

        <section className="home-workflow" id="workflow">
          <div className="home-section-intro">
            <span className="home-kicker">
              How the system is connected
            </span>

            <h2>
              From what the company wants to achieve to what actually
              happened.
            </h2>

            <p>
              ManageOS creates a connected path from company objectives to
              everyday work, communication, results, and the record left
              behind.
            </p>
          </div>

          <div className="home-workflow-list">
            <article className="home-workflow-row">
              <span className="home-workflow-number">01</span>

              <div>
                <h3>Goals</h3>

                <p>
                  Define what the company, organization unit, or project is
                  trying to accomplish.
                </p>
              </div>

              <span className="home-square home-green-square" />
            </article>

            <article className="home-workflow-row">
              <span className="home-workflow-number">02</span>

              <div>
                <h3>Structure</h3>

                <p>
                  Organize people and responsibilities around how the company
                  actually operates.
                </p>
              </div>

              <span className="home-square home-copper-square" />
            </article>

            <article className="home-workflow-row home-featured-row">
              <span className="home-workflow-number">03</span>

              <div>
                <h3>Projects & work</h3>

                <p>
                  Turn objectives into projects, milestones, assignments, and
                  work owned by the people responsible for moving it forward.
                </p>
              </div>

              <span className="home-square home-green-square" />
            </article>

            <article className="home-workflow-row">
              <span className="home-workflow-number">04</span>

              <div>
                <h3>Results</h3>

                <p>
                  Capture updates, discussions, submissions, reviews, outcomes,
                  and the history around them.
                </p>
              </div>

              <span className="home-square home-lime-square" />
            </article>
          </div>
        </section>

        <section className="home-accountability" id="accountability">
          <div className="home-accountability-copy">
            <span className="home-kicker">Accountability</span>

            <h2>Work should leave a useful record.</h2>

            <p>
              ManageOS keeps important actions connected to the work they
              describe, so a company can understand not only what changed, but
              the context and history around the change.
            </p>

            <div className="home-accountability-tags">
              <span>Record</span>
              <span>Context</span>
              <span>History</span>
            </div>
          </div>

          <div className="home-record-panel">
            <div className="home-record-heading">
              <div>
                <span className="home-record-label">Activity record</span>
                <h3>What happened remains visible.</h3>
              </div>

              <span>Authorized access</span>
            </div>

            <div className="home-record-line">
              <span className="home-record-time">Now</span>
              <span className="home-record-marker home-record-green" />

              <div>
                <strong>Work assigned</strong>
                <span>Responsibility and project context recorded.</span>
                <small>Assignment activity</small>
              </div>
            </div>

            <div className="home-record-line home-record-copper-line">
              <span className="home-record-time">Today</span>
              <span className="home-record-marker home-record-copper" />

              <div>
                <strong>Progress update submitted</strong>
                <span>
                  The employee's written update becomes part of the record.
                </span>
                <small>Project progress</small>
              </div>
            </div>

            <div className="home-record-line">
              <span className="home-record-time">Today</span>
              <span className="home-record-marker home-record-sky" />

              <div>
                <strong>Review activity recorded</strong>
                <span>
                  The work keeps the context around the decision.
                </span>
                <small>Review history</small>
              </div>
            </div>

            <div className="home-record-line">
              <span className="home-record-time">Earlier</span>
              <span className="home-record-marker home-record-lime" />

              <div>
                <strong>Result connected</strong>
                <span>
                  The outcome remains attached to the work that produced it.
                </span>
                <small>Result history</small>
              </div>
            </div>
          </div>
        </section>

        <section className="home-roles">
          <div className="home-roles-heading">
            <div>
              <span className="home-kicker">Built around responsibility</span>

              <h2>
                Everyone sees
                <br />
                what they need.
              </h2>
            </div>

            <p>
              ManageOS uses company roles and permissions to keep work
              accessible without making the entire company visible to
              everyone.
            </p>
          </div>

          <div className="home-roles-list">
            <article className="home-role">
              <span>Management</span>

              <p>
                Oversee company structure, projects, people, progress, and
                authorized records.
              </p>
            </article>

            <article className="home-role">
              <span>Team leads</span>

              <p>
                Coordinate work, review submissions, communicate with
                employees, and keep assigned projects moving.
              </p>
            </article>

            <article className="home-role">
              <span>Employees</span>

              <p>
                See assigned responsibilities, provide updates, raise blockers,
                and submit results.
              </p>
            </article>

            <article className="home-role">
              <span>Authorized records</span>

              <p>
                Sensitive company activity is available according to backend
                permissions and company scope.
              </p>
            </article>
          </div>
        </section>

        <section className="home-closing">
          <div>
            <span className="home-kicker">ManageOS</span>

            <h2>
              Make the work visible.
              <br />
              Make the company easier to run.
            </h2>

            <Link to="/register">Create your workspace →</Link>
          </div>

          <div className="home-closing-symbol" aria-hidden="true">
            <span className="home-closing-green" />
            <span className="home-closing-copper" />
            <span className="home-closing-lime" />
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export default Home;