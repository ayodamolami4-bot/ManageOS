import "./Notifications.css";

function Notifications() {
  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-kicker">PERSONAL WORKSPACE</p>

          <h1>
            Notifications
            <span> show what needs your attention.</span>
          </h1>

          <p className="notifications-intro">
            ManageOS brings relevant events to the people they concern,
            including assignments, updates, reviews, requests, and other
            changes that require awareness or action.
          </p>
        </div>

        <button type="button" className="notifications-mark-button">
          Mark all as read
        </button>
      </header>

      <section className="notifications-overview">
        <div className="notifications-section-heading">
          <div>
            <p className="notifications-section-kicker">YOUR INBOX</p>

            <h2>
              The events that
              <span> concern you.</span>
            </h2>
          </div>

          <span className="notifications-section-index">01</span>
        </div>

        <div className="notifications-state-grid">
          <article className="notifications-state notifications-state-green">
            <span>UNREAD</span>

            <strong>Nothing unread.</strong>

            <p>
              New notifications that require attention will appear here.
            </p>
          </article>

          <article className="notifications-state notifications-state-copper">
            <span>ASSIGNMENTS</span>

            <strong>No new assignments.</strong>

            <p>
              Work assigned to you or changes to your responsibilities will be
              surfaced here.
            </p>
          </article>

          <article className="notifications-state notifications-state-lime">
            <span>REVIEWS</span>

            <strong>No review activity.</strong>

            <p>
              Review requests and decisions relevant to you will appear here.
            </p>
          </article>

          <article className="notifications-state notifications-state-sky">
            <span>REQUESTS</span>

            <strong>No pending requests.</strong>

            <p>
              Requests and blockers requiring your attention will appear here
              when they exist.
            </p>
          </article>
        </div>
      </section>

      <section className="notifications-inbox">
        <div className="notifications-section-heading">
          <div>
            <p className="notifications-section-kicker">
              NOTIFICATION HISTORY
            </p>

            <h2>Recent events for your account.</h2>
          </div>

          <span>00</span>
        </div>

        <div className="notifications-empty-state">
          <div className="notifications-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>No notifications yet.</strong>

            <p>
              As work changes, ManageOS will surface relevant events according
              to your permissions, company scope, responsibilities, and
              notification rules.
            </p>
          </div>
        </div>
      </section>

      <section className="notifications-principle">
        <div className="notifications-principle-label">
          <span>MANAGEOS PRINCIPLE</span>
        </div>

        <div>
          <h2>
            Notification should mean
            <span> something relevant happened.</span>
          </h2>

          <p>
            Notifications are not intended to become a constant stream of
            noise. ManageOS should notify the right person when an event has
            a meaningful connection to their work, responsibility, review,
            request, or company activity.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Notifications;