import { Link } from "react-router-dom";
import "./Terms.css";

function Terms() {
  return (
    <main className="terms-page">
      <div className="terms-container">
        <Link to="/" className="terms-back">
          ← Back to ManageOS
        </Link>

        <header className="terms-header">
          <p className="terms-eyebrow">MANAGEOS</p>

          <h1>Terms of Use</h1>

          <p className="terms-intro">
            These terms govern access to and use of ManageOS, including its
            company workspaces, communication features, operational tools, and
            related services.
          </p>

          <p className="terms-updated">
            Last updated: September 30, 2026
          </p>
        </header>

        <section className="terms-section">
          <h2>1. About ManageOS</h2>

          <p>
            ManageOS is a company operations platform designed to help
            organizations structure work, communicate updates, coordinate
            responsibilities, track progress, and maintain an auditable
            history of important activity.
          </p>

          <p>
            These Terms apply to individuals and organizations that access or
            use ManageOS.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Accounts and Access</h2>

          <p>
            You are responsible for providing accurate account information and
            keeping your login credentials secure.
          </p>

          <p>
            Access to company workspaces, projects, conversations, files,
            reports, and other information may depend on the role,
            membership, and permissions assigned to your account.
          </p>

          <p>
            You must not use another person's account, attempt to bypass
            access controls, or access information that you are not authorized
            to view.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Company Workspaces</h2>

          <p>
            ManageOS organizes users within company workspaces. Workspace
            administrators and other authorized users may create
            organization structures, assign roles, manage memberships, and
            control access to company information.
          </p>

          <p>
            Your organization may determine how ManageOS is used within its
            workspace, including who may create projects, assign work, review
            submissions, access reports, or view audit records.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Acceptable Use</h2>

          <p>
            You may use ManageOS only for lawful business, organizational, or
            otherwise legitimate purposes.
          </p>

          <p>You must not:</p>

          <ul>
            <li>
              use the service to violate applicable laws or regulations;
            </li>

            <li>
              attempt to gain unauthorized access to accounts, systems, data,
              or company workspaces;
            </li>

            <li>
              upload malicious software or content intended to damage, disrupt,
              or compromise the service;
            </li>

            <li>
              interfere with the normal operation or security of ManageOS; or
            </li>

            <li>
              use the service to impersonate another person or organization.
            </li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. Company and User Content</h2>

          <p>
            Organizations and users may create or upload information such as
            tasks, reports, comments, discussions, files, requests, and other
            operational content.
          </p>

          <p>
            You remain responsible for the content you submit and for ensuring
            that you have the necessary rights and permissions to provide that
            content through ManageOS.
          </p>

          <p>
            ManageOS may process this information in order to provide the
            functionality of the service, maintain security, operate company
            workflows, and keep relevant activity and audit records.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Permissions and Audit Records</h2>

          <p>
            ManageOS uses role-based permissions and other access controls to
            determine what users may view or change.
          </p>

          <p>
            Certain actions may be recorded as activities or audit events.
            These records are intended to provide organizational visibility,
            accountability, and historical context.
          </p>

          <p>
            Users must not attempt to manipulate, delete, or bypass records or
            controls that they are not authorized to manage.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Files and Uploaded Content</h2>

          <p>
            Files uploaded to ManageOS must comply with applicable law and
            your organization's policies.
          </p>

          <p>
            You must not upload content that you do not have the right to
            store, share, or use through the service.
          </p>
        </section>

        <section className="terms-section">
          <h2>8. Availability and Service Changes</h2>

          <p>
            We may modify, improve, suspend, or discontinue parts of ManageOS
            as the product develops.
          </p>

          <p>
            We will aim to maintain the availability, reliability, and
            security of the service, but no online service can guarantee
            uninterrupted operation at all times.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Suspension and Termination</h2>

          <p>
            Access to ManageOS may be restricted or suspended where necessary
            to protect the service, its users, company data, or security, or
            where use of the service violates these Terms or applicable law.
          </p>

          <p>
            Organization administrators may also manage or remove user access
            within their company workspace according to their permissions and
            internal policies.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Security Responsibilities</h2>

          <p>
            Security is a shared responsibility. ManageOS is designed with
            authentication, authorization, request protection, company
            scoping, and auditability in mind.
          </p>

          <p>
            You are responsible for using the service securely, protecting
            account credentials, and reporting suspected unauthorized access
            or security issues through the appropriate support channel.
          </p>
        </section>

        <section className="terms-section">
          <h2>11. Intellectual Property</h2>

          <p>
            The ManageOS name, branding, software, interface, and associated
            materials are protected by applicable intellectual property laws.
          </p>

          <p>
            These Terms do not transfer ownership of ManageOS or its underlying
            software to users or organizations.
          </p>
        </section>

        <section className="terms-section">
          <h2>12. Privacy</h2>

          <p>
            The handling of personal information and other data is described in
            the ManageOS Privacy Notice.
          </p>
        </section>

        <section className="terms-section">
          <h2>13. Changes to These Terms</h2>

          <p>
            These Terms may be updated as ManageOS evolves, legal requirements
            change, or additional services and capabilities are introduced.
          </p>

          <p>
            When material changes are made, the updated version will be
            published through the appropriate ManageOS channels.
          </p>
        </section>

        <section className="terms-section">
          <h2>14. Contact</h2>

          <p>
            Questions about these Terms or the use of ManageOS can be directed
            through the contact information provided on the ManageOS Contact
            page.
          </p>
        </section>

        <footer className="terms-footer">
          <p>
            These Terms are part of the current ManageOS product build and may
            require further legal review before production launch.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default Terms;