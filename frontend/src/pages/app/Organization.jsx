import "./Organization.css";

function Organization() {
  return (
    <div className="organization-page">
      <header className="organization-header">
        <div>
          <p className="organization-kicker">COMPANY STRUCTURE</p>

          <h1>
            Organization
            <span> built around how the company works.</span>
          </h1>

          <p className="organization-intro">
            Define the units, responsibilities, and relationships that make up
            the company. ManageOS does not assume every company is organized
            the same way.
          </p>
        </div>

        <button type="button" className="organization-create-button">
          Add organization unit
        </button>
      </header>

      <section className="organization-model">
        <div className="organization-section-heading">
          <div>
            <p className="organization-section-kicker">STRUCTURE</p>

            <h2>
              The company defines
              <span> its own operating structure.</span>
            </h2>
          </div>

          <span className="organization-section-index">01</span>
        </div>

        <div className="organization-model-grid">
          <article className="organization-model-item organization-model-green">
            <span>UNIT</span>

            <strong>Give a group of work a place.</strong>

            <p>
              Organization units can represent departments, branches, regions,
              operations, divisions, or another structure appropriate to the
              company.
            </p>
          </article>

          <article className="organization-model-item organization-model-copper">
            <span>PEOPLE</span>

            <strong>Connect people to responsibility.</strong>

            <p>
              Members belong to the organization structure that reflects where
              and how they work inside the company.
            </p>
          </article>

          <article className="organization-model-item organization-model-lime">
            <span>WORK</span>

            <strong>Give projects the right context.</strong>

            <p>
              Projects and responsibilities can be connected to the structure
              the company has established.
            </p>
          </article>
        </div>
      </section>

      <section className="organization-register">
        <div className="organization-section-heading">
          <div>
            <p className="organization-section-kicker">
              ORGANIZATION REGISTER
            </p>

            <h2>How the company is organized.</h2>
          </div>

          <span>00</span>
        </div>

        <div className="organization-empty-state">
          <div className="organization-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No organization units have been created.</strong>

            <p>
              Once the company structure is established, organization units
              and their members will appear here.
            </p>
          </div>
        </div>
      </section>

      <section className="organization-principle">
        <div className="organization-principle-label">
          <span>MANAGEOS PRINCIPLE</span>
        </div>

        <div>
          <h2>
            Structure should
            <span> fit the company.</span>
          </h2>

          <p>
            A logistics company may organize around regions and operations. A
            retailer may organize around branches and functions. A manufacturer
            may organize around production and facilities. ManageOS provides
            the structure without deciding what that structure has to be.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Organization;