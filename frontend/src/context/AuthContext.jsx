import { useEffect, useState } from "react";

import { AuthContext } from "./authContext";

import { getCurrentUser } from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await getCurrentUser();

        if (active) {
          setUser(response?.data?.user || null);
          setAuthError(null);
        }
      } catch (error) {
        if (active) {
          setUser(null);
          setAuthError(error?.status === 401 ? null : error);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setAuthError(null);
    }

    window.addEventListener("manageos:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "manageos:session-expired",
        handleSessionExpired
      );
    };
  }, []);

  function retrySession() {
    setIsLoading(true);
    setAuthError(null);
    setRetryCount((count) => count + 1);
  }

  function signIn(nextUser) {
    setUser(nextUser);
    setAuthError(null);
  }

  function signOut() {
    setUser(null);
    setAuthError(null);
  }

  const value = {
    user,
    setUser,
    isLoading,
    authError,
    isAuthenticated: Boolean(user),
    retrySession,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

