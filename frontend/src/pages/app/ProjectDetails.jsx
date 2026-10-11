import { Link, useParams } from "react-router-dom";
import "./ProjectDetails.css";

function ProjectDetails() {
  const { projectId } = useParams();

  return (
    <div className="project-details-page">
      <header className="project-details-header">
        <div className="project-details-breadcrumb">
          <Link to="/app/projects">Projects</Link>
          <span>/</span>
          <span>Project details</span>
        </div>

        <div className="project-details-heading">
          <div>
            <p className="project-details-kicker">PROJECT</p>

            <h1>
              Project details
              <span> where the work comes together.</span>
            </h1>

            <p className="project-details-intro">
              A project connects its purpose, organizational context,
              milestones, responsibilities, progress, review, results, and
              operational history.
            </p>
          </div>

          <span className="project-details-reference">
            {projectId || "PROJECT"}
          </span>
        </div>
      </header>

      <section className="project-details-context">
        <div className="project-details-section-heading">
          <div>
            <p className="project-details-section-kicker">PROJECT CONTEXT</p>

            <h2>
              Why this project
              <span> exists.</span>
            </h2>
          </div>

          <span>01</span>
        </div>

        <div className="project-details-context-grid">
          <article className="project-details-context-item">
            <span>GOAL</span>

            <strong>No connected goal yet.</strong>

            <p>
              The project goal will explain the broader company or
              organization objective this work supports.
            </p>
          </article>

          <article className="project-details-context-item">
            <span>ORGANIZATION</span>

            <strong>No organization context yet.</strong>

            <p>
              The organization unit responsible for the project will appear
              here when one is connected.
            </p>
          </article>

          <article className="project-details-context-item">
            <span>LEADERSHIP</span>

            <strong>No project lead assigned.</strong>

            <p>
              Authorized project leadership will appear here and determine who
              is responsible for moving the project forward.
            </p>
          </article>
        </div>
      </section>

      <section className="project-details-milestones">
        <div className="project-details-section-heading">
          <div>
            <p className="project-details-section-kicker">MILESTONES</p>

            <h2>
              Important stages of the
              <span> project.</span>
            </h2>
          </div>

          <span>02</span>
        </div>

        <div className="project-details-empty-panel">
          <strong>No milestones have been created.</strong>

          <p>
            Milestones will divide the project into meaningful stages and give
            its work a clearer path toward the intended result.
          </p>
        </div>
      </section>

      <section className="project-details-work">
        <div className="project-details-section-heading">
          <div>
            <p className="project-details-section-kicker">PROJECT WORK</p>

            <h2>
              The responsibilities
              <span> moving the project forward.</span>
            </h2>
          </div>

          <span>03</span>
        </div>

        <div className="project-details-work-panel">
          <div className="project-details-work-state">
            <span>ASSIGNED</span>
            <strong>No project work yet.</strong>
            <p>
              Work belonging to this project will appear here with its current
              owner and state.
            </p>
          </div>

          <div className="project-details-work-state">
            <span>IN PROGRESS</span>
            <strong>Nothing in progress.</strong>
            <p>
              Active work will remain connected to its project and milestone
              context.
            </p>
          </div>

          <div className="project-details-work-state">
            <span>REVIEW</span>
            <strong>Nothing awaiting review.</strong>
            <p>
              Submitted work requiring authorized review will surface here.
            </p>
          </div>
        </div>
      </section>

      <section className="project-details-record">
        <div className="project-details-section-heading">
          <div>
            <p className="project-details-section-kicker">
              PROJECT RECORD
            </p>

            <h2>
              The story of the project
              <span> stays connected.</span>
            </h2>
          </div>

          <span>04</span>
        </div>

        <div className="project-details-record-list">
          <div>
            <span>UPDATES</span>
            <strong>No progress updates yet.</strong>
            <p>
              Written updates will show what is happening and what needs
              attention.
            </p>
          </div>

          <div>
            <span>DISCUSSIONS</span>
            <strong>No project discussions yet.</strong>
            <p>
              Project communication will remain connected to the work it
              concerns.
            </p>
          </div>

          <div>
            <span>RESULT</span>
            <strong>No result recorded yet.</strong>
            <p>
              The project's eventual outcome will remain attached to the work
              and decisions that produced it.
            </p>
          </div>

          <div>
            <span>HISTORY</span>
            <strong>No project activity yet.</strong>
            <p>
              Authorized activity and important project changes will become
              part of the operational record.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectDetails;