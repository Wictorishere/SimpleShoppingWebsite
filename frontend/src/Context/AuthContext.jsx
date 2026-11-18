import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  api,
  clearTokens,
  readTokens,
  saveTokens,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function handleExpired() {
      setUser(null);
    }

    window.addEventListener("shop:auth-expired", handleExpired);

    async function restoreSession() {
      try {
        if (!readTokens()) return;

        const currentUser = await api("/api/accounts/me/", {
          auth: true,
        });

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        if (error.status === 401) {
          clearTokens();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
      window.removeEventListener(
        "shop:auth-expired",
        handleExpired
      );
    };
  }, []);

  async function login({ username, password }) {
    const tokens = await api("/api/accounts/login/", {
      method: "POST",
      body: { username, password },
    });

    if (!tokens?.access || !tokens?.refresh) {
      throw new Error("پاسخ ورود معتبر نیست.");
    }

    saveTokens(tokens);

    try {
      const currentUser = await api("/api/accounts/me/", {
        auth: true,
      });

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearTokens();
      setUser(null);
      throw error;
    }
  }

    async function register({
    username,
    password,
    password_confirm,
    }) {
    return api("/api/accounts/register/", {
        method: "POST",
        body: {
        username,
        password,
        password_confirm,
        },
    });
    }

  
  async function updateProfile(values) {
    const updatedUser = await api("/api/accounts/me/", {
        method: "PATCH",
        auth: true,
        body: values,
  });

  setUser(updatedUser);

  return updatedUser;
}


  function logout() {
    clearTokens();
    setUser(null);
  }

  return (

    <AuthContext.Provider
    value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth باید داخل AuthProvider استفاده شود."
    );
  }

  return context;
}
