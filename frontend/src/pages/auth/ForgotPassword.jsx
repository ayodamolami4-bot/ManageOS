import "./ForgotPassword.css";

function ForgotPassword() {
  return (
    <main className="forgot-page">
      <div className="forgot-background" aria-hidden="true">
        <div className="forgot-background-photo forgot-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="forgot-background-photo forgot-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="forgot-background-photo forgot-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="forgot-nav">
        <a href="/" className="forgot-brand">
          <span className="forgot-brand-mark">M</span>
          <span>ManageOS</span>
        </a>

        <a href="/login" className="forgot-back">
          Back to sign in
        </a>
      </nav>

      <section className="forgot-main">
        <div className="forgot-intro">
          <span className="forgot-kicker">Account recovery</span>

          <h1>
            Get back to
            <br />
            <em>the work.</em>
          </h1>

          <p>
            Enter the email address connected to your ManageOS account. We’ll
            use it to send instructions for resetting your password.
          </p>

          <div className="forgot-note">
            <span className="forgot-note-line" />
            <span>Your company workspace remains protected.</span>
          </div>
        </div>

        <div className="forgot-panel">
          <div className="forgot-panel-header">
            <span>Reset access</span>
            <strong>M</strong>
          </div>

          <h2>Forgot your password?</h2>

          <p className="forgot-panel-description">
            No problem. Enter your account email below to begin the recovery
            process.
          </p>

          <form className="forgot-form">
            <div className="forgot-field">
              <label htmlFor="forgot-email">Email address</label>

              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <button type="submit" className="forgot-submit">
              Send reset instructions
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="forgot-return">
            <span>Remember your password?</span>

            <a href="/login">Return to sign in →</a>
          </div>
        </div>
      </section>

      <footer className="forgot-footer">
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

export default ForgotPassword;