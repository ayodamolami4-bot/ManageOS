import { NavLink, Outlet } from "react-router-dom";
import "./AppLayout.css";

const workspaceNavigation = [
  { label: "Overview", path: "/app/overview" },
  { label: "Goals", path: "/app/goals" },
  { label: "Organization", path: "/app/organization" },
  { label: "People", path: "/app/people" },
  { label: "Projects", path: "/app/projects" },
  { label: "Work", path: "/app/work" },
  { label: "Updates", path: "/app/updates" },
  { label: "Discussions", path: "/app/discussions" },
  { label: "Notifications", path: "/app/notifications" },
  { label: "Activity", path: "/app/activity" },
  { label: "Audit", path: "/app/audit" },
  { label: "Files", path: "/app/files" },
];

function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>

          <div>
            <strong>ManageOS</strong>
            <span>Company Operations</span>
          </div>
        </div>

        <div className="app-company-context">
          <span>COMPANY OPERATIONS</span>
          <strong>Workspace</strong>
        </div>

        <nav className="app-navigation" aria-label="Workspace navigation">
          {workspaceNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "app-nav-link app-nav-link-active"
                  : "app-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-context">
            <span>WORKSPACE</span>
            <strong>Company Operations</strong>
          </div>

          <div className="app-user">
            <div className="app-user-avatar">U</div>

            <div className="app-user-details">
              <strong>User</strong>
              <span>Company member</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;