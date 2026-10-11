import "./Invite.css";

function Invite() {
  return (
    <main className="invite-page">
      <div className="invite-background" aria-hidden="true">
        <div className="invite-background-photo invite-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="invite-background-photo invite-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="invite-background-photo invite-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="invite-nav">
        <a href="/" className="invite-brand">
          <span className="invite-brand-mark">M</span>
          <span>ManageOS</span>
        </a>

        <a href="/login" className="invite-login">
          Already have an account?
          <span>Login →</span>
        </a>
      </nav>

      <section className="invite-main">
        <div className="invite-intro">
          <span className="invite-kicker">Company invitation</span>

          <h1>
            Join the
            <br />
            <em>right workspace.</em>
          </h1>

          <p>
            ManageOS invitations connect you directly to an existing company
            workspace. Accept your invitation to create your account and join
            the work already in progress.
          </p>

          <div className="invite-details">
            <div>
              <span className="invite-square invite-green" />
              <div>
                <strong>Your company</strong>
                <p>You’ll join the company named in your invitation.</p>
              </div>
            </div>

            <div>
              <span className="invite-square invite-copper" />
              <div>
                <strong>Your role</strong>
                <p>Your company administrator determines your access.</p>
              </div>
            </div>

            <div>
              <span className="invite-square invite-lime" />
              <div>
                <strong>Your workspace</strong>
                <p>Your projects, assignments and updates will follow your permissions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="invite-panel">
          <div className="invite-panel-header">
            <div>
              <span>Accept invitation</span>
              <h2>Join your workspace.</h2>
            </div>

            <span className="invite-panel-mark">M</span>
          </div>

          <div className="invite-company">
            <span className="invite-company-label">Invited by</span>

            <strong>Acme Commerce Ltd.</strong>

            <p>
              You’ve been invited to join this company on ManageOS.
            </p>
          </div>

          <form className="invite-form">
            <div className="invite-field">
              <label htmlFor="invite-name">Full name</label>

              <input
                id="invite-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
              />
            </div>

            <div className="invite-field">
              <label htmlFor="invite-email">Email address</label>

              <input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />

              <span>
                Use the email address that received the invitation.
              </span>
            </div>

            <div className="invite-field">
              <label htmlFor="invite-password">Create password</label>

              <input
                id="invite-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
              />

              <span>
                Use at least 8 characters with a letter and a number.
              </span>
            </div>

            <label className="invite-terms">
              <input type="checkbox" name="terms" />

              <span>
                I agree to the <a href="/terms">ManageOS Terms</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            <button type="submit" className="invite-submit">
              Accept invitation
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="invite-existing">
            <span>Already have a ManageOS account?</span>
            <a href="/login">Login →</a>
          </div>
        </div>
      </section>

      <footer className="invite-footer">
        <span>Company operations, connected.</span>

        <div>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>
    </main>
  );
}

export default Invite;