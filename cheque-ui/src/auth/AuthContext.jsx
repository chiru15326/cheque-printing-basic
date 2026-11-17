import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);

function isExpired(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=")));
    return !json.exp || json.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function loadUser() {
  const token = localStorage.getItem("token");
  const saved = localStorage.getItem("user");
  if (!token || !saved || isExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const navigate = useNavigate();

  /** Call with the response from /api/auth/login or /register */
  const signIn = useCallback((auth) => {
    const u = { userId: auth.userId, fullName: auth.fullName, email: auth.email };
    localStorage.setItem("token", auth.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // If any API call returns 401 (token expired), log out and go to the login page
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
      navigate("/login", { replace: true });
    });
  }, [signOut, navigate]);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
