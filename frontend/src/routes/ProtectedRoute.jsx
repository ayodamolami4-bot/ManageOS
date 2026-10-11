import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="app-route-loading">
        <p>Checking your workspace session...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="app-route-loading">
        <p>Unable to verify your workspace session.</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;