import { Link } from "react-router-dom";
import "./PublicLayout.css";

function PublicLayout({ children }) {
  return (
    <main className="public-site">
      <div className="public-background" aria-hidden="true">
        <div className="public-background-photo public-background-green">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="public-background-photo public-background-copper">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>

        <div className="public-background-photo public-background-lime">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=75"
            alt=""
          />
        </div>
      </div>

      <nav className="public-nav">
        <Link to="/" className="public-brand">
          <span className="public-brand-mark">M</span>
          <span>ManageOS</span>
        </Link>

        <div className="public-nav-links">
          <Link to="/">Home</Link>
          <Link to="/product">Product</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/security">Security</Link>
        </div>

        <div className="public-nav-actions">
          <Link to="/login" className="public-login">
            Login
          </Link>

          <Link to="/register" className="public-nav-cta">
            Get started
          </Link>
        </div>
      </nav>

      <div className="public-content">{children}</div>

      <footer className="public-footer">
        <Link to="/" className="public-footer-brand">
          <span className="public-brand-mark">M</span>
          <span>ManageOS</span>
        </Link>

        <div className="public-footer-links">
          <Link to="/product">Product</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/security">Security</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>

        <span className="public-footer-copy">
          Company operations, connected.
        </span>
      </footer>
    </main>
  );
}

export default PublicLayout;