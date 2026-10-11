import "./Register.css";

function Register() {
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

          <form className="register-form">
            <div className="register-field">
              <label htmlFor="full-name">Full name</label>

              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>

              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>

              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
              />

              <span className="register-hint">
                Use at least 8 characters with a letter and a number.
              </span>
            </div>

            <div className="register-field">
              <label htmlFor="confirm-password">Confirm password</label>

              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
              />
            </div>

            <label className="register-terms">
              <input type="checkbox" name="terms" />

              <span>
                I agree to the <a href="/terms">ManageOS Terms</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            <button type="submit" className="register-submit">
              Create ManageOS account
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