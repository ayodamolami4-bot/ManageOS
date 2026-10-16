import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { post } from "../services/api";
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
  { label: "Activity", path: "/app/activity", permission: "activity.view" },
  { label: "Audit", path: "/app/audit", permission: "audit.view" },
  { label: "Files", path: "/app/files" },
  { label: "Account", path: "/app/account" },
];

function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const allowedPermissions = new Set(Array.isArray(user?.permissions) ? user.permissions : []);
  const visibleNavigation = workspaceNavigation.filter(
    (item) => !item.permission || allowedPermissions.has(item.permission)
  );

  const workspaceName = user?.company_name || "Your company workspace";

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Company member";

  const initials =
    [user?.first_name?.[0], user?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "M";

  async function handleSignOut() {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await post("/auth/logout");
      signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error?.message || "Unable to sign out. Try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <div className="app-brand">
            <span className="app-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <div>
              <strong>ManageOS</strong>
              <span>Company Operations</span>
            </div>
          </div>

          <div className="app-company-context">
            <span>COMPANY WORKSPACE</span>
            <strong>{workspaceName}</strong>
          </div>
        </div>

        <nav className="app-navigation" aria-label="Workspace navigation">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
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
            <strong>{workspaceName}</strong>
          </div>

          <div className="app-user">
            <div className="app-user-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="app-user-details">
              <strong>{displayName}</strong>
              <span>Company member</span>
            </div>
            <button
              className="app-sign-out"
              type="button"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </header>

        {logoutError && (
          <p className="app-logout-error" role="alert">
            {logoutError}
          </p>
        )}

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
