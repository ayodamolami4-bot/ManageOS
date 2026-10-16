import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./Product.css";

function Product() {
  return (
    <PublicLayout>
      <section className="product-page">
        <div className="product-hero">
          <div className="product-hero-copy">
            <p className="product-kicker">The operating layer for company work</p>

            <h1>
              One place to understand
              <span> how the work is moving.</span>
            </h1>

            <p className="product-hero-text">
              ManageOS connects company structure, projects, everyday work,
              updates, results and audit records in one system.
            </p>

            <div className="product-hero-actions">
              <Link to="/register" className="product-primary-action">
                Create your workspace
              </Link>

              <Link to="/login" className="product-secondary-action">
                Login
              </Link>
            </div>
          </div>

          <div className="product-hero-visual">
            <div className="product-visual-header">
              <div>
                <span className="product-visual-label">Company operations</span>
                <strong>Work in context</strong>
              </div>

              <span className="product-status">Active</span>
            </div>

            <div className="product-flow">
              <div className="product-flow-item">
                <span className="product-flow-number">01</span>
                <div>
                  <strong>Goals</strong>
                  <p>What the company is trying to achieve.</p>
                </div>
              </div>

              <div className="product-flow-line" />

              <div className="product-flow-item">
                <span className="product-flow-number">02</span>
                <div>
                  <strong>Structure</strong>
                  <p>Who is responsible for each area of work.</p>
                </div>
              </div>

              <div className="product-flow-line" />

              <div className="product-flow-item">
                <span className="product-flow-number">03</span>
                <div>
                  <strong>Projects & work</strong>
                  <p>What is being worked on and who owns it.</p>
                </div>
              </div>

              <div className="product-flow-line" />

              <div className="product-flow-item">
                <span className="product-flow-number">04</span>
                <div>
                  <strong>Updates</strong>
                  <p>What has changed, what is blocked and what needs attention.</p>
                </div>
              </div>

              <div className="product-flow-line" />

              <div className="product-flow-item">
                <span className="product-flow-number">05</span>
                <div>
                  <strong>Results</strong>
                  <p>What was completed, reviewed and submitted.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="product-intro">
          <div>
            <p className="product-section-kicker">Built around visibility</p>
            <h2>
              The work should tell
              <span> the story.</span>
            </h2>
          </div>

          <p>
            Teams often have the information they need, but it is scattered
            across conversations, spreadsheets, files and separate tools.
            ManageOS brings the operational story together so people can
            understand what is happening without chasing updates.
          </p>
        </section>

        <section className="product-capabilities">
          <article className="product-capability product-capability-green">
            <span className="product-capability-tag">01</span>

            <h3>Company structure</h3>

            <p>
              Organize the company around the way work actually happens.
              Create flexible organizational units, assign people and give
              responsibilities a clear place.
            </p>

            <div className="product-capability-flow">
              <span>Company</span>
              <span>→</span>
              <span>Organization units</span>
              <span>→</span>
              <span>People</span>
            </div>
          </article>

          <article className="product-capability product-capability-copper">
            <span className="product-capability-tag">02</span>

            <h3>Projects & work</h3>

            <p>
              Turn company objectives into projects, milestones and tasks.
              Everyone can see where their work belongs and who is responsible
              for moving it forward.
            </p>

            <div className="product-capability-flow">
              <span>Goal</span>
              <span>→</span>
              <span>Project</span>
              <span>→</span>
              <span>Work</span>
            </div>
          </article>

          <article className="product-capability product-capability-lime">
            <span className="product-capability-tag">03</span>

            <h3>Updates & communication</h3>

            <p>
              Keep progress visible through structured updates, direct
              communication, blockers, requests and discussions connected to
              the work itself.
            </p>

            <div className="product-capability-flow">
              <span>Work</span>
              <span>→</span>
              <span>Update</span>
              <span>→</span>
              <span>Discussion</span>
            </div>
          </article>

          <article className="product-capability product-capability-sky">
            <span className="product-capability-tag">04</span>

            <h3>Results & review</h3>

            <p>
              Submitted work can move through review and approval so completion
              is not just assumed. The system keeps the result connected to the
              work that produced it.
            </p>

            <div className="product-capability-flow">
              <span>Submission</span>
              <span>→</span>
              <span>Review</span>
              <span>→</span>
              <span>Result</span>
            </div>
          </article>

          <article className="product-capability product-capability-record">
            <span className="product-capability-tag">05</span>

            <h3>Audit & history</h3>

            <p>
              Important operational events become part of the company's
              history, making it easier to understand what happened, when it
              happened and what changed.
            </p>

            <div className="product-capability-flow">
              <span>Action</span>
              <span>→</span>
              <span>Context</span>
              <span>→</span>
              <span>Record</span>
            </div>
          </article>
        </section>

        <section className="product-roles">
          <div className="product-roles-heading">
            <p className="product-section-kicker">Different responsibilities</p>

            <h2>
              Everyone sees the work
              <span> through their role.</span>
            </h2>
          </div>

          <div className="product-role-list">
            <div className="product-role-row">
              <span>Management</span>
              <p>
                Understand company progress, review work and keep operations
                moving.
              </p>
            </div>

            <div className="product-role-row">
              <span>Team leads</span>
              <p>
                Coordinate assigned projects, guide employees and review
                submitted work.
              </p>
            </div>

            <div className="product-role-row">
              <span>Employees</span>
              <p>
                See assigned work, submit updates, raise blockers and
                communicate with the people involved.
              </p>
            </div>

            <div className="product-role-row">
              <span>Authorized records</span>
              <p>
                Keep operational history available according to the access
                rules of the company.
              </p>
            </div>
          </div>
        </section>

        <section className="product-record">
          <div className="product-record-copy">
            <p className="product-section-kicker">The operational record</p>

            <h2>
              Not just what happened.
              <span> The context around it.</span>
            </h2>

            <p>
              A completed task is useful. A completed task connected to its
              project, owner, update, review and relevant history is far more
              useful.
            </p>
          </div>

          <div className="product-record-panel">
            <div className="product-record-row">
              <span>Work</span>
              <strong>What was being done</strong>
            </div>

            <div className="product-record-row">
              <span>Change</span>
              <strong>What changed along the way</strong>
            </div>

            <div className="product-record-row">
              <span>Update</span>
              <strong>What the person reported</strong>
            </div>

            <div className="product-record-row">
              <span>Result</span>
              <strong>What was submitted or completed</strong>
            </div>

            <div className="product-record-row">
              <span>Audit</span>
              <strong>What the system recorded</strong>
            </div>
          </div>
        </section>

        <section className="product-closing">
          <p className="product-section-kicker">Make the work visible</p>

          <h2>
            Give the company
            <span> a clearer operating picture.</span>
          </h2>

          <Link to="/register" className="product-primary-action">
            Create your workspace
          </Link>
        </section>
      </section>
    </PublicLayout>
  );
}

export default Product;