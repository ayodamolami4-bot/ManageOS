import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./Contact.css";

function Contact() {
  return (
    <PublicLayout>
      <section className="contact-page">
        <section className="contact-hero">
          <div className="contact-hero-copy">
            <p className="contact-kicker">CONTACT</p>

            <h1>
              Let's talk about
              <span> what you're building.</span>
            </h1>

            <p className="contact-hero-text">
              Whether you're interested in ManageOS, want to discuss the
              product, or want to work together, you can reach me directly
              through the contact details below.
            </p>
          </div>

          <div className="contact-hero-panel">
            <span className="contact-panel-label">DIRECT CONTACT</span>

            <a
              href="mailto:ayodamolami4@gmail.com"
              className="contact-panel-email"
            >
              ayodamolami4@gmail.com
            </a>

            <a href="tel:+2349017879895" className="contact-panel-phone">
              +234 901 787 9895
            </a>
          </div>
        </section>

        <section className="contact-details">
          <div className="contact-details-heading">
            <p className="contact-section-kicker">GET IN TOUCH</p>

            <h2>
              Choose the channel
              <span> that works for you.</span>
            </h2>
          </div>

          <div className="contact-details-list">
            <a
              href="mailto:ayodamolami4@gmail.com"
              className="contact-detail-row"
            >
              <div className="contact-detail-type">EMAIL</div>

              <div className="contact-detail-content">
                <strong>ayodamolami4@gmail.com</strong>
                <p>For product questions, collaborations, and general enquiries.</p>
              </div>

              <span className="contact-detail-arrow">↗</span>
            </a>

            <a
              href="tel:+2349017879895"
              className="contact-detail-row"
            >
              <div className="contact-detail-type">PHONE</div>

              <div className="contact-detail-content">
                <strong>+234 901 787 9895</strong>
                <p>For direct contact when a conversation is easier by phone.</p>
              </div>

              <span className="contact-detail-arrow">↗</span>
            </a>

            <a
              href="https://x.com/AdesinaAyodamol"
              target="_blank"
              rel="noreferrer"
              className="contact-detail-row"
            >
              <div className="contact-detail-type">X</div>

              <div className="contact-detail-content">
                <strong>Damola | Software Developer</strong>
                <p>@AdesinaAyodamol</p>
              </div>

              <span className="contact-detail-arrow">↗</span>
            </a>

            <a
              href="https://www.linkedin.com/in/ayodamola-adesina-698558431"
              target="_blank"
              rel="noreferrer"
              className="contact-detail-row"
            >
              <div className="contact-detail-type">LINKEDIN</div>

              <div className="contact-detail-content">
                <strong>AYODAMOLA Adesina</strong>
                <p>Professional profile and career contact.</p>
              </div>

              <span className="contact-detail-arrow">↗</span>
            </a>

            <a
              href="https://github.com/ayodamolami4-bot"
              target="_blank"
              rel="noreferrer"
              className="contact-detail-row"
            >
              <div className="contact-detail-type">GITHUB</div>

              <div className="contact-detail-content">
                <strong>ayodamolami4-bot</strong>
                <p>Projects, source code, and software development work.</p>
              </div>

              <span className="contact-detail-arrow">↗</span>
            </a>
          </div>
        </section>

        <section className="contact-manageos">
          <div className="contact-manageos-copy">
            <p className="contact-section-kicker">ABOUT MANAGEOS</p>

            <h2>
              Building a better way
              <span> to understand company work.</span>
            </h2>

            <p>
              ManageOS is being built around company communication,
              responsibility, progress, results, and operational history.
            </p>
          </div>

          <div className="contact-manageos-links">
            <Link to="/product">Explore the product →</Link>
            <Link to="/how-it-works">See how it works →</Link>
            <Link to="/security">Security & access →</Link>
          </div>
        </section>

        <section className="contact-closing">
          <p className="contact-section-kicker">START A CONVERSATION</p>

          <h2>
            Have something
            <span> worth discussing?</span>
          </h2>

          <a
            href="mailto:ayodamolami4@gmail.com"
            className="contact-closing-button"
          >
            Email me
          </a>
        </section>
      </section>
    </PublicLayout>
  );
}

export default Contact;