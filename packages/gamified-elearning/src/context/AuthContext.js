import React, { createContext, useContext, useState, useEffect } from "react";
import { trackEvent } from "../utils/trackEvent";
import { API_BASE_URL } from "../config/api";
import { syncUnderstandingToAccount } from "../utils/understanding";

export const AuthContext = createContext();

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function markAuthenticatedVisit(token) {
  const today = localDateKey();
  const previous = localStorage.getItem("codeit_last_seen_date");

  if (previous && previous !== today) {
    trackEvent("return_use", null, token);
  }

  localStorage.setItem("codeit_last_seen_date", today);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        markAuthenticatedVisit(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // The understanding records a browser already holds move to the account the
  // first time this learner signs in here — so no family loses what their
  // child already showed before the account routes existed. Learners only:
  // a parent signing in on the family computer must not inherit a child's
  // evidence.
  useEffect(() => {
    if (!token || !user) return;
    const role = String(user.role || "").toLowerCase();
    if (role !== "student") return;
    void syncUnderstandingToAccount(localStorage, {
      token,
      userId: user.id || user.user_id || user.userId,
      apiBaseUrl: API_BASE_URL,
    });
  }, [token, user]);

  const login = (userData) => {
    const { user, token } = userData;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    localStorage.setItem("codeit_last_seen_date", localDateKey());

    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
