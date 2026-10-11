import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { post } from "../../services/api";
import { apiErrorMessage, apiFieldErrors, validateName } from "../../utils/validation";
import "./Invite.css";

function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const [form, setForm] = useState({
    firstName: "", lastName: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!validToken) nextErrors.token = "A valid invitation link is required.";
    const first = validateName(form.firstName, "First name");
    const last = validateName(form.lastName, "Last name");
    if (first) nextErrors.firstName = first;
    if (last) nextErrors.lastName = last;
    if (form.password.length < 12 || form.password.length > 128) {
      nextErrors.password = "Password must be between 12 and 128 characters.";
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    setErrorMessage("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await post("/invitations/accept", {
        token,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
      });

      navigate("/login", { replace: true, state: { invitationAccepted: true } });
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function fieldError(field) {
    return errors[field] ? (
      <span role="alert" style={{ color: "#a44333" }}>{errors[field]}</span>
    ) : null;
  }

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
            <span className="invite-company-label">Invitation status</span>
            <strong>{validToken ? "Invitation link received" : "Invitation link required"}</strong>
            <p>
              {validToken
                ? "Your company, role and invitation status will be verified securely when you accept."
                : "Open the unique invitation link provided by your company administrator."}
            </p>
          </div>

          <form className="invite-form" onSubmit={handleSubmit} noValidate>
            <div className="invite-field">
              <label htmlFor="invite-first">First name</label>
              <input
                id="invite-first"
                type="text"
                autoComplete="given-name"
                required
                maxLength={100}
                disabled={saving}
                value={form.firstName}
                aria-invalid={Boolean(errors.firstName)}
                onChange={(event) => update("firstName", event.target.value)}
              />
              {fieldError("firstName")}
            </div>
            <div className="invite-field">
              <label htmlFor="invite-last">Last name</label>
              <input
                id="invite-last"
                type="text"
                autoComplete="family-name"
                required
                maxLength={100}
                disabled={saving}
                value={form.lastName}
                aria-invalid={Boolean(errors.lastName)}
                onChange={(event) => update("lastName", event.target.value)}
              />
              {fieldError("lastName")}
            </div>
            <div className="invite-field">
              <label htmlFor="invite-password">Create password</label>
              <input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                disabled={saving}
                value={form.password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => update("password", event.target.value)}
              />
              <span>Use at least 12 characters.</span>
              {fieldError("password")}
            </div>
            <div className="invite-field">
              <label htmlFor="invite-confirm">Confirm password</label>
              <input
                id="invite-confirm"
                type="password"
                autoComplete="new-password"
                required
                disabled={saving}
                value={form.confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                onChange={(event) => update("confirmPassword", event.target.value)}
              />
              {fieldError("confirmPassword")}
            </div>
            {(errorMessage || errors.token) && (
              <p role="alert" style={{ color: "#a44333" }}>
                {errorMessage || errors.token}
              </p>
            )}
            <button type="submit" className="invite-submit" disabled={saving || !validToken}>
              {saving ? "Accepting..." : "Accept invitation"}
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