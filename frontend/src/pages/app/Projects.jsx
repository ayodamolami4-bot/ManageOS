import WorkRecordManager from "../../components/WorkRecordManager";
import "./Projects.css";

function Projects() {
  return (
    <div className="projects-page">
      <header className="projects-header">
        <div>
          <p className="projects-kicker">COMPANY EXECUTION</p>

          <h1>
            Projects
            <span> turn direction into work.</span>
          </h1>

          <p className="projects-intro">
            Create projects around the outcomes the company is trying to
            achieve, connect them to the right organizational context, and keep
            the work moving through milestones, assignments, updates, review,
            and results.
          </p>
        </div>

      </header>

      <section className="projects-context">
        <div className="projects-section-heading">
          <div>
            <p className="projects-section-kicker">PROJECT CONTEXT</p>

            <h2>
              Every project should have
              <span> a reason to exist.</span>
            </h2>
          </div>

          <span className="projects-section-index">01</span>
        </div>

        <div className="projects-context-grid">
          <article className="projects-context-item projects-context-green">
            <span>GOAL</span>

            <strong>Connect work to direction.</strong>

            <p>
              A project can be connected to a company or organization goal so
              people can understand what the work is intended to achieve.
            </p>
          </article>

          <article className="projects-context-item projects-context-copper">
            <span>STRUCTURE</span>

            <strong>Place the project in context.</strong>

            <p>
              Projects can be associated with the organization structure that
              is responsible for moving the work forward.
            </p>
          </article>

          <article className="projects-context-item projects-context-lime">
            <span>RESULT</span>

            <strong>Move toward an outcome.</strong>

            <p>
              Milestones, work, updates, submissions, reviews, and results stay
              connected to the project.
            </p>
          </article>
        </div>
      </section>

      <section className="projects-register">
        <WorkRecordManager kind="project" />
      </section>

      <section className="projects-model">
        <div className="projects-model-heading">
          <p className="projects-section-kicker">PROJECT MODEL</p>

          <h2>
            A project keeps the
            <span> work connected.</span>
          </h2>
        </div>

        <div className="projects-model-chain">
          <div>
            <span>01</span>

            <strong>Purpose</strong>

            <p>Why the project exists.</p>
          </div>

          <div>
            <span>02</span>

            <strong>Milestones</strong>

            <p>Important stages of the work.</p>
          </div>

          <div>
            <span>03</span>

            <strong>Assignments</strong>

            <p>Who is responsible for moving it forward.</p>
          </div>

          <div>
            <span>04</span>

            <strong>Updates</strong>

            <p>What is happening as the work progresses.</p>
          </div>

          <div>
            <span>05</span>

            <strong>Result</strong>

            <p>What the work ultimately produced.</p>
          </div>

          <div>
            <span>06</span>

            <strong>History</strong>

            <p>What changed and what the record shows.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Projects;