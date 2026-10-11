import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { post } from "../../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await post("/auth/login", {
        email: email.trim(),
        password,
      });

      signIn(response.data);

      const from = location.state?.from;
      const target =
        from?.pathname === "/app" ||
        from?.pathname?.startsWith("/app/")
          ? from.pathname + (from.search || "") + (from.hash || "")
          : "/app/overview";

      navigate(target, { replace: true });
    } catch (error) {
      const backendMessage =
        error?.data?.error?.message ||
        error?.message ||
        "Unable to sign in. Please try again.";

      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background" aria-hidden="true">
        <div className="login-background-photo login-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="login-background-photo login-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="login-background-photo login-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="login-nav">
        <a href="/" className="login-brand">
          <span className="login-brand-mark">M</span>
          <span>ManageOS</span>
        </a>

        <a href="/" className="login-back">
          Back to home
        </a>
      </nav>

      <section className="login-main">
        <div className="login-intro">
          <span className="login-kicker">ManageOS workspace</span>

          <h1>
            Keep the work
            <br />
            <em>connected.</em>
          </h1>

          <p>
            Sign in to see your projects, assignments, updates, results and
            company activity in one place.
          </p>

          <div className="login-flow" aria-hidden="true">
            <span className="login-flow-item login-flow-green">Goals</span>
            <span className="login-flow-line" />
            <span className="login-flow-item">Work</span>
            <span className="login-flow-line" />
            <span className="login-flow-item login-flow-copper">Updates</span>
            <span className="login-flow-line" />
            <span className="login-flow-item login-flow-lime">Results</span>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-panel-header">
            <div>
              <span className="login-panel-kicker">Workspace access</span>
              <h2>Welcome back.</h2>
            </div>

            <span className="login-panel-mark" aria-hidden="true">
              M
            </span>
          </div>

          {location.state?.accountCreated && (
            <p className="login-security-note" role="status">
              Your company account has been created. Sign in to continue.
            </p>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="password">Password</label>

                <a href="/forgot-password">Forgot password?</a>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <p className="login-error" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Signing in..."
                : "Sign in to ManageOS"}

              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="login-register">
            <span>Don't have a ManageOS account?</span>

            <a href="/register">Create an account →</a>
          </div>

          <div className="login-divider">
            <span />
            <span>or</span>
            <span />
          </div>

          <div className="login-invite">
            <p>Joining an existing company for the first time?</p>

            <a href="/invite">Accept an invitation →</a>
          </div>

          <div className="login-security-note">
            <span className="security-dot" />

            <span>
              Your workspace access is controlled by company permissions.
            </span>
          </div>
        </div>
      </section>

      <footer className="login-footer">
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

export default Login;