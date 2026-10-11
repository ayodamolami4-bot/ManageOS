import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./Security.css";

function Security() {
  return (
    <PublicLayout>
      <section className="security-page">
        <section className="security-hero">
          <div className="security-hero-copy">
            <p className="security-kicker">SECURITY & ACCESS</p>

            <h1>
              Company information
              <span> should stay in the right hands.</span>
            </h1>

            <p className="security-hero-text">
              ManageOS is designed around controlled access, company
              boundaries, authenticated sessions, and a clear record of
              important actions.
            </p>

            <div className="security-hero-actions">
              <Link to="/register" className="security-primary-button">
                Create your workspace
              </Link>

              <Link to="/product" className="security-secondary-button">
                Explore the product
              </Link>
            </div>
          </div>

          <div className="security-hero-panel">
            <div className="security-panel-heading">
              <span>ACCESS MODEL</span>
              <strong>Access follows responsibility</strong>
            </div>

            <div className="security-access-row">
              <span>01</span>
              <div>
                <strong>Identity</strong>
                <p>Users authenticate before entering the workspace.</p>
              </div>
            </div>

            <div className="security-access-row">
              <span>02</span>
              <div>
                <strong>Company boundary</strong>
                <p>Company data is scoped to the company it belongs to.</p>
              </div>
            </div>

            <div className="security-access-row">
              <span>03</span>
              <div>
                <strong>Role permissions</strong>
                <p>Access is determined by the user's role and permissions.</p>
              </div>
            </div>

            <div className="security-access-row security-access-final">
              <span>04</span>
              <div>
                <strong>Audit trail</strong>
                <p>Important actions can remain part of the operational record.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="security-principles">
          <div className="security-section-heading">
            <p className="security-section-kicker">THE PRINCIPLE</p>

            <h2>
              Security should be part of
              <span> how the system works.</span>
            </h2>
          </div>

          <div className="security-section-copy">
            <p>
              ManageOS is not built around one security feature. Access,
              authentication, company scoping, roles, permissions, sessions,
              validation, and operational records work together as part of the
              application.
            </p>

            <p>
              That matters because company information is connected. A project
              can relate to a team, a team to an employee, and an employee's
              actions to the operational history of the company.
            </p>
          </div>
        </section>

        <section className="security-features">
          <div className="security-features-heading">
            <p className="security-section-kicker">PROTECTION LAYERS</p>

            <h2>
              Multiple controls.
              <span> One access model.</span>
            </h2>
          </div>

          <div className="security-feature-grid">
            <article className="security-feature security-feature-green">
              <span>01</span>

              <h3>Authenticated sessions</h3>

              <p>
                ManageOS uses server-side sessions with secure HTTP-only cookies
                so authentication is handled by the backend rather than
                exposing session credentials to page scripts.
              </p>
            </article>

            <article className="security-feature security-feature-copper">
              <span>02</span>

              <h3>Role-based access</h3>

              <p>
                Permissions are enforced according to the user's role and the
                resources that role is allowed to access.
              </p>
            </article>

            <article className="security-feature security-feature-lime">
              <span>03</span>

              <h3>Company scoping</h3>

              <p>
                Operational records belong to a company, helping prevent data
                from being treated as globally accessible across unrelated
                workspaces.
              </p>
            </article>

            <article className="security-feature security-feature-sky">
              <span>04</span>

              <h3>Request protection</h3>

              <p>
                The backend applies request validation and other protections
                around sensitive operations instead of trusting the browser to
                enforce security by itself.
              </p>
            </article>

            <article className="security-feature security-feature-green">
              <span>05</span>

              <h3>Audit records</h3>

              <p>
                Important actions can be recorded with operational context,
                helping authorized users understand what changed and when.
              </p>
            </article>

            <article className="security-feature security-feature-copper">
              <span>06</span>

              <h3>Controlled access to information</h3>

              <p>
                Access to company information is intended to follow the
                application's authorization rules rather than simply being
                available to every authenticated user.
              </p>
            </article>
          </div>
        </section>

        <section className="security-access">
          <div className="security-access-copy">
            <p className="security-section-kicker">ACCESS & RESPONSIBILITY</p>

            <h2>
              Authentication answers
              <span> “who are you?”</span>
            </h2>

            <p>
              Authorization answers a different question: “what are you
              allowed to do?” ManageOS keeps those ideas separate so logging
              into the system does not automatically mean having unrestricted
              access.
            </p>
          </div>

          <div className="security-access-panel">
            <div className="security-access-panel-row">
              <span>IDENTITY</span>
              <strong>The system establishes the authenticated user.</strong>
            </div>

            <div className="security-access-panel-row">
              <span>MEMBERSHIP</span>
              <strong>The user belongs to a specific company workspace.</strong>
            </div>

            <div className="security-access-panel-row">
              <span>ROLE</span>
              <strong>The user's role determines available responsibilities.</strong>
            </div>

            <div className="security-access-panel-row">
              <span>PERMISSION</span>
              <strong>The requested action is checked against access rules.</strong>
            </div>
          </div>
        </section>

        <section className="security-audit">
          <div className="security-audit-copy">
            <p className="security-section-kicker">AUDITABILITY</p>

            <h2>
              A secure system should also
              <span> explain what happened.</span>
            </h2>

            <p>
              Security and auditability are connected. When important
              operational actions are recorded, authorized people can inspect
              the history instead of relying entirely on memory or scattered
              messages.
            </p>
          </div>

          <div className="security-audit-flow">
            <div className="security-audit-item">
              <span>ACTION</span>
              <strong>Something changes in the system.</strong>
            </div>

            <div className="security-audit-arrow">→</div>

            <div className="security-audit-item">
              <span>CONTEXT</span>
              <strong>The relevant operational information is preserved.</strong>
            </div>

            <div className="security-audit-arrow">→</div>

            <div className="security-audit-item security-audit-final">
              <span>RECORD</span>
              <strong>The event becomes part of the company's history.</strong>
            </div>
          </div>
        </section>

        <section className="security-responsibility">
          <div className="security-responsibility-heading">
            <p className="security-section-kicker">SHARED RESPONSIBILITY</p>

            <h2>
              Security is not only
              <span> a backend concern.</span>
            </h2>
          </div>

          <div className="security-responsibility-list">
            <div className="security-responsibility-row">
              <span>Users</span>

              <p>
                Keep account credentials private and use the system according
                to their organization's access rules.
              </p>
            </div>

            <div className="security-responsibility-row">
              <span>Organizations</span>

              <p>
                Assign roles and access deliberately and review who should have
                access to company information.
              </p>
            </div>

            <div className="security-responsibility-row">
              <span>ManageOS</span>

              <p>
                Enforce authentication, authorization, validation, company
                scoping, and protected application workflows on the server.
              </p>
            </div>
          </div>
        </section>

        <section className="security-closing">
          <p className="security-section-kicker">SECURITY BY DESIGN</p>

          <h2>
            Keep company information
            <span> connected and controlled.</span>
          </h2>

          <Link to="/register" className="security-closing-button">
            Create your workspace
          </Link>
        </section>
      </section>
    </PublicLayout>
  );
}

export default Security;