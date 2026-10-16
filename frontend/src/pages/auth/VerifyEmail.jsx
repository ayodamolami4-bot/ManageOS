import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { post } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "./Register.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function confirm() {
    if (!validToken || status === "sending" || status === "success") return;
    setStatus("sending");
    setError("");
    try {
      await post("/auth/verify-company", { token });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(apiErrorMessage(err));
    }
  }

  return (
    <main className="register-page">
      <nav className="register-nav">
        <Link className="register-brand" to="/">
          <span className="register-brand-mark">M</span>
          <span>ManageOS</span>
        </Link>
        <Link className="register-back" to="/login">Sign in →</Link>
      </nav>
      <section className="register-main">
        <div className="register-intro">
          <span className="register-kicker">Secure company onboarding</span>
          <h1>Verify your <em>email.</em></h1>
          <p>Only the owner of the email address can activate a new company workspace.</p>
        </div>
        <div className="register-panel" aria-live="polite">
          <div className="register-panel-header">
            <div>
              <span className="register-panel-kicker">One last step</span>
              <h2>
                {status === "success" ? "Your company is ready." :
                  validToken ? "Confirm your email." : "Check your inbox."}
              </h2>
            </div>
            <span className="register-panel-mark" aria-hidden="true">M</span>
          </div>

          {status === "success" ? (
            <>
              <p>Your email is verified and your company workspace is active.</p>
              <p><Link className="register-submit" to="/login">Sign in to ManageOS →</Link></p>
            </>
          ) : validToken ? (
            <>
              <p>This single-use verification link will activate the company you registered.</p>
              <p>Confirm only if you requested a ManageOS company account.</p>
              {error && <p className="register-hint" role="alert">{error}</p>}
              <button className="register-submit" type="button"
                onClick={confirm} disabled={status === "sending"}>
                {status === "sending" ? "Activating your company..." : "Verify email and activate company"}
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <>
              <p>We sent a private verification link to the email address used at registration.</p>
              <p>Check your Inbox and Spam folders. The link expires after 24 hours.</p>
              {token && <p role="alert">This link is invalid. Request a new link by registering again.</p>}
              <p><Link to="/register">Return to registration →</Link></p>
            </>
          )}
        </div>
      </section>
      <footer className="register-footer">
        <span>Company operations, connected.</span>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}
