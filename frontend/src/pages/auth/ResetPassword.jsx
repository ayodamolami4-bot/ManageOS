import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { post } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "./ResetPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!validToken) return setError("Your password reset link is invalid or missing.");
    if (password.length < 12 || password.length > 128) {
      return setError("Choose a password between 12 and 128 characters.");
    }
    if (password !== confirmation) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const response = await post("/auth/reset-password", { token, password });
      setMessage(response?.message || "Password updated. Sign in with your new password.");
      setPassword("");
      setConfirmation("");
      // Remove the credential from history after it has been consumed.
      window.history.replaceState(null, "", "/reset-password");
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="reset-page">
      <div className="reset-background" aria-hidden="true">
        <div className="reset-background-photo reset-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="reset-background-photo reset-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="reset-background-photo reset-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="reset-nav">
        <a href="/" className="reset-brand">
          <span className="reset-brand-mark">M</span>
          <span>ManageOS</span>
        </a>

        <a href="/login" className="reset-back">
          Back to login
        </a>
      </nav>

      <section className="reset-main">
        <div className="reset-intro">
          <span className="reset-kicker">Password recovery</span>

          <h1>
            A new password.
            <br />
            <em>Then back to work.</em>
          </h1>

          <p>
            Choose a new password for your ManageOS account. Once it is saved,
            you can return to your company workspace.
          </p>

          <div className="reset-process">
            <div className="reset-process-item">
              <span className="reset-process-square reset-green" />
              <div>
                <strong>Secure reset</strong>
                <p>Your reset link gives access only to this password flow.</p>
              </div>
            </div>

            <div className="reset-process-item">
              <span className="reset-process-square reset-copper" />
              <div>
                <strong>Choose your password</strong>
                <p>Use a password you can keep secure and remember.</p>
              </div>
            </div>

            <div className="reset-process-item">
              <span className="reset-process-square reset-lime" />
              <div>
                <strong>Return to your workspace</strong>
                <p>Once complete, use your new password to log in.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="reset-panel">
          <div className="reset-panel-header">
            <div>
              <span>Account security</span>
              <h2>Set a new password.</h2>
            </div>

            <span className="reset-panel-mark">M</span>
          </div>

          <form className="reset-form" onSubmit={submit} noValidate>
            <div className="reset-field">
              <label htmlFor="new-password">New password</label>

              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Create a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                disabled={saving}
              />

              <span className="reset-hint">
                Use 12–128 characters. A long, unique passphrase is recommended.
              </span>
            </div>

            <div className="reset-field">
              <label htmlFor="confirm-new-password">
                Confirm new password
              </label>

              <input
                id="confirm-new-password"
                name="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter the password again"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                disabled={saving}
              />
            </div>

            {error && <p className="auth-form-feedback" role="alert">{error}</p>}
            {message && <p className="auth-form-feedback auth-form-feedback--success" role="status">{message}</p>}
            {!validToken && !message && <p className="auth-form-feedback" role="alert">Open a valid reset link from your email.</p>}
            <button type="submit" className="reset-submit" disabled={saving || !validToken || Boolean(message)}>
              {saving ? "Saving..." : "Save new password"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="reset-return">
            <span>Remembered your password?</span>
            <a href="/login">Back to login →</a>
          </div>
        </div>
      </section>

      <footer className="reset-footer">
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

export default ResetPassword;