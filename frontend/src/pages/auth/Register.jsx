import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { post } from "../../services/api";
import {
  apiErrorMessage,
  apiFieldErrors,
  validateRegistration,
} from "../../utils/validation";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateRegistration(form);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);

    try {
      await post("/auth/register/company", {
        companyName: form.companyName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/login", { replace: true, state: { accountCreated: true } });
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setServerError(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field) {
    return errors[field] ? (
      <span className="register-hint" id={"register-" + field + "-error"} role="alert" style={{ color: "#a44333" }}>
        {errors[field]}
      </span>
    ) : null;
  }

  return (
    <main className="register-page">
      <div className="register-background" aria-hidden="true">
        <div className="register-background-photo register-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="register-background-photo register-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="register-background-photo register-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="register-nav">
        <a href="/" className="register-brand">
          <span className="register-brand-mark">M</span>
          <span>ManageOS</span>
        </a>

        <a href="/login" className="register-back">
          Already have an account?
          <span>Sign in →</span>
        </a>
      </nav>

      <section className="register-main">
        <div className="register-intro">
          <span className="register-kicker">Create a workspace account</span>

          <h1>
            Start with
            <br />
            <em>the company.</em>
          </h1>

          <p>
            Create your ManageOS account to organize company work, connect
            updates to projects and keep a useful record of what happens.
          </p>

          <div className="register-principles">
            <div>
              <span className="register-square register-square-green" />
              <p>
                <strong>Structure</strong>
                Organize the people and work around how the company operates.
              </p>
            </div>

            <div>
              <span className="register-square register-square-copper" />
              <p>
                <strong>Responsibility</strong>
                Give work clear ownership and keep progress visible.
              </p>
            </div>

            <div>
              <span className="register-square register-square-lime" />
              <p>
                <strong>Record</strong>
                Keep important updates, results and changes connected.
              </p>
            </div>
          </div>
        </div>

        <div className="register-panel">
          <div className="register-panel-header">
            <div>
              <span className="register-panel-kicker">New account</span>
              <h2>Create your account.</h2>
            </div>

            <span className="register-panel-mark" aria-hidden="true">
              M
            </span>
          </div>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <div className="register-field">
              <label htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Your company"
                maxLength={200}
                required
                disabled={submitting}
                value={form.companyName}
                aria-invalid={Boolean(errors.companyName)}
                onChange={(event) => update("companyName", event.target.value)}
              />
              {fieldError("companyName")}
            </div>

            <div className="register-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Your first name"
                maxLength={100}
                required
                disabled={submitting}
                value={form.firstName}
                aria-invalid={Boolean(errors.firstName)}
                onChange={(event) => update("firstName", event.target.value)}
              />
              {fieldError("firstName")}
            </div>

            <div className="register-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Your last name"
                maxLength={100}
                required
                disabled={submitting}
                value={form.lastName}
                aria-invalid={Boolean(errors.lastName)}
                onChange={(event) => update("lastName", event.target.value)}
              />
              {fieldError("lastName")}
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                maxLength={254}
                required
                disabled={submitting}
                value={form.email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => update("email", event.target.value)}
              />
              {fieldError("email")}
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                minLength={12}
                maxLength={128}
                required
                disabled={submitting}
                value={form.password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => update("password", event.target.value)}
              />
              <span className="register-hint">Use at least 12 characters.</span>
              {fieldError("password")}
            </div>

            <div className="register-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                required
                disabled={submitting}
                value={form.confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                onChange={(event) => update("confirmPassword", event.target.value)}
              />
              {fieldError("confirmPassword")}
            </div>

            <label className="register-terms">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                disabled={submitting}
                onChange={(event) => update("acceptedTerms", event.target.checked)}
              />
              <span>
                I agree to the <a href="/terms">ManageOS Terms</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>
            {fieldError("acceptedTerms")}

            {serverError && <p role="alert" className="register-hint" style={{ color: "#a44333" }}>{serverError}</p>}

            <button type="submit" className="register-submit" disabled={submitting}>
              {submitting ? "Creating your account..." : "Create ManageOS account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="register-divider">
            <span />
            <span>or</span>
            <span />
          </div>

          <div className="register-login">
            <span>Already registered?</span>

            <a href="/login">Sign in to ManageOS →</a>
          </div>

          <p className="register-invitation">
            Joining an existing company? Use your invitation link instead of
            creating a new company account.
          </p>
        </div>
      </section>

      <footer className="register-footer">
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

export default Register;