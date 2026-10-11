import { useState } from "react";
import { post } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const response = await post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setMessage(response?.message || "If an account exists, reset instructions will be sent.");
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

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

          <form className="forgot-form" onSubmit={submit} noValidate>
            <div className="forgot-field">
              <label htmlFor="forgot-email">Email address</label>

              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                disabled={saving}
                aria-invalid={Boolean(error)}
              />
            </div>

            {error && <p className="auth-form-feedback" role="alert">{error}</p>}
            {message && <p className="auth-form-feedback auth-form-feedback--success" role="status">{message}</p>}
            <button type="submit" className="forgot-submit" disabled={saving}>
              {saving ? "Sending..." : "Send reset instructions"}
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