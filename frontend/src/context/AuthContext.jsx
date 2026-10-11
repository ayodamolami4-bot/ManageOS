import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCurrentUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await getCurrentUser();

        setUser(response?.data?.user || null);
        setAuthError(null);
      } catch (error) {
        /*
         * A 401 simply means there is no valid
         * authenticated session.
         *
         * Other errors are worth keeping so the
         * application can distinguish a server
         * problem from a logged-out user.
         */
        if (error?.status === 401) {
          setUser(null);
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError(error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    authError,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}