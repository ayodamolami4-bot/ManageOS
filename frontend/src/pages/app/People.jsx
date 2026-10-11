import "./People.css";

function People() {
  return (
    <main className="people-page">
      <section className="people-header">
        <div>
          <p className="people-eyebrow">COMPANY PEOPLE</p>
          <h1>Manage the people who make the company work.</h1>
          <p className="people-intro">
            People brings company members, responsibilities, roles, and
            organizational access into one place.
          </p>
        </div>

        <div className="people-context">
          <span className="people-context-label">WORKSPACE</span>
          <strong>Company members</strong>
        </div>
      </section>

      <section className="people-summary">
        <div className="people-summary-item">
          <span>MEMBERS</span>
          <strong>—</strong>
          <p>People currently belonging to the company.</p>
        </div>

        <div className="people-summary-item">
          <span>INVITATIONS</span>
          <strong>—</strong>
          <p>Pending invitations waiting for acceptance.</p>
        </div>

        <div className="people-summary-item">
          <span>ORGANIZATION</span>
          <strong>—</strong>
          <p>Members connected to the company's structure.</p>
        </div>
      </section>

      <section className="people-section">
        <div className="people-section-header">
          <div>
            <p className="people-section-kicker">COMPANY MEMBERS</p>
            <h2>People</h2>
          </div>

          <button type="button" className="people-invite-button">
            Invite person
          </button>
        </div>

        <div className="people-table">
          <div className="people-table-header">
            <span>PERSON</span>
            <span>ROLE</span>
            <span>ORGANIZATION</span>
            <span>STATUS</span>
          </div>

          <div className="people-empty">
            <h3>No company members to display yet.</h3>

            <p>
              People who join the company will appear here with their role,
              organizational membership, and account status.
            </p>
          </div>
        </div>
      </section>

      <section className="people-principles">
        <div className="people-principle">
          <span className="people-principle-number">01</span>

          <div>
            <h3>Role is responsibility</h3>
            <p>
              A person's role should determine what they are responsible for
              and what company actions they are authorized to perform.
            </p>
          </div>
        </div>

        <div className="people-principle">
          <span className="people-principle-number">02</span>

          <div>
            <h3>Organization gives context</h3>
            <p>
              People can belong to flexible organization units without forcing
              every company into the same departmental structure.
            </p>
          </div>
        </div>

        <div className="people-principle">
          <span className="people-principle-number">03</span>

          <div>
            <h3>Access follows membership</h3>
            <p>
              Membership, role, and resource permissions work together to
              determine what each person can see and change.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default People;