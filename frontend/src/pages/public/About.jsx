import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import "./About.css";

function About() {
  return (
    <PublicLayout>
      <section className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="about-kicker">ABOUT MANAGEOS</p>

            <h1>
              Make the company
              <span> easier to understand.</span>
            </h1>

            <p className="about-hero-text">
              ManageOS is designed for companies across industries, giving
              goals, responsibility, communication, work, results, and history
              a connected place to live.
            </p>

            <div className="about-hero-actions">
              <Link to="/product" className="about-primary-button">
                Explore the product
              </Link>

              <Link to="/how-it-works" className="about-secondary-button">
                See how it works
              </Link>
            </div>
          </div>

          <div className="about-hero-art" aria-hidden="true">
            <div className="about-art-square about-art-green">
              <span>WORK</span>
            </div>

            <div className="about-art-square about-art-copper">
              <span>CHANGE</span>
            </div>

            <div className="about-art-square about-art-lime">
              <span>PROGRESS</span>
            </div>
          </div>
        </section>

        <section className="about-story">
          <div className="about-section-heading">
            <p className="about-section-kicker">THE IDEA</p>

            <h2>
              Companies have information.
              <span> The problem is keeping it connected.</span>
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Every company works differently. A retailer, logistics company,
              professional service firm, manufacturer, agency, or growing
              business may have completely different responsibilities and ways
              of working.
            </p>

            <p>
              But the underlying challenge is often similar: goals affect
              projects, projects create work, people provide updates, decisions
              are made, results are reviewed, and important history needs to
              remain understandable.
            </p>

            <p>
              ManageOS is designed to connect those relationships without
              forcing every company into the same industry-specific workflow.
            </p>
          </div>
        </section>

        <section className="about-principles">
          <div className="about-principles-heading">
            <p className="about-section-kicker">WHAT WE BELIEVE</p>

            <h2>
              Build around the work,
              <span> not around noise.</span>
            </h2>
          </div>

          <div className="about-principles-grid">
            <article className="about-principle about-principle-green">
              <span>01</span>

              <h3>Clarity</h3>

              <p>
                People should be able to understand what matters, what is
                moving, and what needs attention without searching through
                disconnected information.
              </p>
            </article>

            <article className="about-principle about-principle-copper">
              <span>02</span>

              <h3>Responsibility</h3>

              <p>
                Work should have a clear relationship to the people responsible
                for moving it forward.
              </p>
            </article>

            <article className="about-principle about-principle-lime">
              <span>03</span>

              <h3>Communication</h3>

              <p>
                Updates, blockers, requests, and discussions are more useful
                when they remain connected to the work they describe.
              </p>
            </article>

            <article className="about-principle about-principle-sky">
              <span>04</span>

              <h3>History</h3>

              <p>
                Important operational changes should leave enough context for
                authorized people to understand what happened later.
              </p>
            </article>
          </div>
        </section>

        <section className="about-platform">
          <div className="about-platform-copy">
            <p className="about-section-kicker">THE PLATFORM</p>

            <h2>
              Built around your company,
              <span> not your industry.</span>
            </h2>

            <p>
              ManageOS brings company structure, goals, projects, tasks,
              progress updates, communication, reviews, files, activities, and
              audit records into one operating environment.
            </p>

            <p>
              Your company defines what its teams, projects, responsibilities,
              and workflows look like. ManageOS provides the connected
              structure that keeps the work understandable.
            </p>
          </div>

          <div className="about-platform-list">
            <div className="about-platform-row">
              <span>GOALS</span>
              <strong>Give work direction.</strong>
            </div>

            <div className="about-platform-row">
              <span>STRUCTURE</span>
              <strong>Give responsibility a place.</strong>
            </div>

            <div className="about-platform-row">
              <span>PROJECTS</span>
              <strong>Turn objectives into work.</strong>
            </div>

            <div className="about-platform-row">
              <span>UPDATES</span>
              <strong>Keep people informed.</strong>
            </div>

            <div className="about-platform-row">
              <span>RESULTS</span>
              <strong>Connect activity to outcomes.</strong>
            </div>

            <div className="about-platform-row">
              <span>AUDIT</span>
              <strong>Preserve operational history.</strong>
            </div>
          </div>
        </section>

        <section className="about-difference">
          <div className="about-difference-heading">
            <p className="about-section-kicker">OUR APPROACH</p>

            <h2>
              Useful visibility.
              <span> Not constant surveillance.</span>
            </h2>
          </div>

          <div className="about-difference-copy">
            <p>
              ManageOS is designed to help a company understand its work
              without making every minute of an employee's day the center of
              the system.
            </p>

            <p>
              The focus is on responsibility, communication, progress,
              submissions, review, and meaningful operational records.
            </p>
          </div>
        </section>

        <section className="about-people">
          <div className="about-people-heading">
            <p className="about-section-kicker">
              DESIGNED FOR REAL RESPONSIBILITIES
            </p>

            <h2>
              Different roles.
              <span> One connected operation.</span>
            </h2>
          </div>

          <div className="about-people-list">
            <div className="about-person-row">
              <span>Management</span>

              <p>
                Set direction, oversee projects, review progress, and maintain
                company-level visibility.
              </p>
            </div>

            <div className="about-person-row">
              <span>Team leads</span>

              <p>
                Coordinate work, support employees, review submissions, and
                keep assigned projects moving.
              </p>
            </div>

            <div className="about-person-row">
              <span>Employees</span>

              <p>
                Work on assigned responsibilities, provide updates, raise
                blockers, and communicate around the work.
              </p>
            </div>
          </div>
        </section>

        <section className="about-closing">
          <p className="about-section-kicker">THE GOAL</p>

          <h2>
            Make the work visible.
            <span> Make the company easier to run.</span>
          </h2>

          <div className="about-closing-actions">
            <Link to="/register" className="about-closing-primary">
              Create your workspace
            </Link>

            <Link to="/contact" className="about-closing-secondary">
              Contact us
            </Link>
          </div>
        </section>
      </section>
    </PublicLayout>
  );
}

export default About;