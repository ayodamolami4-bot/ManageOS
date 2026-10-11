import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./Privacy.css";

function Privacy() {
  return (
    <PublicLayout>
      <section className="privacy-page">
        <header className="privacy-header">
          <p className="privacy-kicker">PRIVACY</p>

          <h1>
            ManageOS Privacy
            <span> Notice</span>
          </h1>

          <div className="privacy-header-meta">
            <p>
              This working notice explains the types of information ManageOS
              may process and how that information is intended to be handled.
            </p>

            <span>Last updated: September 2026</span>
          </div>
        </header>

        <div className="privacy-layout">
          <aside className="privacy-sidebar">
            <span>ON THIS PAGE</span>

            <nav>
              <a href="#information">Information we collect</a>
              <a href="#use">How information is used</a>
              <a href="#company-data">Company and work data</a>
              <a href="#security">Security</a>
              <a href="#sharing">Sharing information</a>
              <a href="#retention">Retention</a>
              <a href="#rights">Your choices</a>
              <a href="#contact">Contact</a>
            </nav>
          </aside>

          <article className="privacy-document">
            <section id="information" className="privacy-section">
              <span className="privacy-section-number">01</span>

              <h2>Information we collect</h2>

              <p>
                ManageOS may process information needed to create accounts,
                operate company workspaces, communicate with users, and provide
                the application's operational features.
              </p>

              <h3>Account information</h3>

              <p>
                This can include information such as your name, email address,
                password-related credentials, account status, and information
                associated with your membership in a company workspace.
              </p>

              <h3>Operational information</h3>

              <p>
                Depending on how the application is used, ManageOS may process
                goals, organizational structures, projects, milestones, tasks,
                assignments, progress updates, submissions, blockers, requests,
                discussions, comments, notifications, activities, files, and
                related records.
              </p>

              <h3>Security and technical information</h3>

              <p>
                The application may also process information needed to
                authenticate sessions, protect the service, validate requests,
                prevent abuse, and maintain reliable operation.
              </p>
            </section>

            <section id="use" className="privacy-section">
              <span className="privacy-section-number">02</span>

              <h2>How information is used</h2>

              <p>
                Information processed through ManageOS is intended to support
                the operation of the service and the company workspace using
                it.
              </p>

              <div className="privacy-points">
                <div>
                  <strong>Operate the service</strong>
                  <p>
                    To authenticate users, provide requested features, and
                    maintain company workspaces.
                  </p>
                </div>

                <div>
                  <strong>Support company operations</strong>
                  <p>
                    To connect goals, people, projects, work, updates, results,
                    and operational history.
                  </p>
                </div>

                <div>
                  <strong>Protect the service</strong>
                  <p>
                    To enforce access rules, detect misuse, validate requests,
                    and maintain application security.
                  </p>
                </div>

                <div>
                  <strong>Communicate with users</strong>
                  <p>
                    To send service-related communications such as invitations,
                    account messages, and password-reset messages where those
                    features are enabled.
                  </p>
                </div>
              </div>
            </section>

            <section id="company-data" className="privacy-section">
              <span className="privacy-section-number">03</span>

              <h2>Company and work data</h2>

              <p>
                ManageOS is designed for company workspaces. Information
                created inside a workspace may therefore relate to both an
                individual user and the organization operating that workspace.
              </p>

              <p>
                Company administrators and other authorized users may have
                access to information according to the application's roles,
                permissions, and company access rules.
              </p>

              <div className="privacy-highlight">
                <span>IMPORTANT</span>

                <p>
                  Signing into ManageOS does not by itself mean a user has
                  unrestricted access to everything in a company workspace.
                  Access is intended to follow the application's authorization
                  rules.
                </p>
              </div>
            </section>

            <section id="security" className="privacy-section">
              <span className="privacy-section-number">04</span>

              <h2>Security</h2>

              <p>
                ManageOS is built with multiple application-level security
                controls rather than relying on the frontend alone.
              </p>

              <div className="privacy-security-grid">
                <div>
                  <strong>Authenticated sessions</strong>
                  <p>
                    Session-based authentication is used for signed-in users,
                    with HTTP-only cookies used for session credentials.
                  </p>
                </div>

                <div>
                  <strong>Access control</strong>
                  <p>
                    Role and permission checks are performed by the backend for
                    protected operations.
                  </p>
                </div>

                <div>
                  <strong>Company scoping</strong>
                  <p>
                    Company-specific operational data is intended to remain
                    scoped to its appropriate workspace.
                  </p>
                </div>

                <div>
                  <strong>Request protection</strong>
                  <p>
                    The backend uses validation and other protections around
                    sensitive requests.
                  </p>
                </div>
              </div>

              <p>
                No internet-connected system can be guaranteed to be completely
                secure. Security controls may also change as ManageOS moves
                from development into production.
              </p>
            </section>

            <section id="sharing" className="privacy-section">
              <span className="privacy-section-number">05</span>

              <h2>Sharing information</h2>

              <p>
                ManageOS is intended to share information only where necessary
                to operate the service, support requested functionality, or
                comply with applicable obligations.
              </p>

              <h3>Within a company workspace</h3>

              <p>
                Information may be visible to other members of the same
                company according to the roles and permissions configured for
                that workspace.
              </p>

              <h3>Service providers</h3>

              <p>
                As the platform moves into production, third-party providers
                may process limited information on behalf of ManageOS for
                services such as email delivery, hosting, storage, monitoring,
                or other infrastructure functions.
              </p>

              <h3>Legal or security requirements</h3>

              <p>
                Information may be disclosed where required by applicable law,
                a valid legal process, or where reasonably necessary to protect
                the service, its users, or other people from security or abuse
                risks.
              </p>
            </section>

            <section id="retention" className="privacy-section">
              <span className="privacy-section-number">06</span>

              <h2>Retention</h2>

              <p>
                Information should be retained only for as long as reasonably
                necessary for the purposes for which it was collected,
                including operating the service, maintaining company records,
                meeting security requirements, and satisfying applicable legal
                obligations.
              </p>

              <p>
                Specific production retention periods for account data, files,
                activity records, audit records, and deleted information will be
                defined as the ManageOS infrastructure and operational policies
                are finalized.
              </p>
            </section>

            <section id="rights" className="privacy-section">
              <span className="privacy-section-number">07</span>

              <h2>Your choices</h2>

              <p>
                Depending on where you live and the laws that apply to you, you
                may have rights relating to your personal information. These
                can include requesting access to information, correcting
                inaccurate information, requesting deletion where applicable,
                or asking questions about how information is handled.
              </p>

              <p>
                Requests should be made using the contact information below.
                Some requests may need to be handled through the relevant
                company administrator where the information belongs to an
                organization's workspace.
              </p>
            </section>

            <section id="contact" className="privacy-section privacy-contact">
              <span className="privacy-section-number">08</span>

              <h2>Contact</h2>

              <p>
                Questions about this Privacy Notice or the handling of
                information in ManageOS can be directed to:
              </p>

              <a href="mailto:ayodamolami4@gmail.com">
                ayodamolami4@gmail.com
              </a>

              <p className="privacy-contact-note">
                ManageOS privacy practices may be updated as the product,
                infrastructure, and production policies develop.
              </p>
            </section>
          </article>
        </div>

        <footer className="privacy-footer">
          <div>
            <span>ManageOS</span>
            <p>Company operations, connected.</p>
          </div>

          <div className="privacy-footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </footer>
      </section>
    </PublicLayout>
  );
}

export default Privacy;