/**
 * context/AuthContext.jsx
 * Provides authentication state (user, token) and actions (login, logout, register)
 * to the entire React tree via context.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

// ── Helper: load persisted state from localStorage ─────────────────────────
const loadPersisted = () => {
  try {
    const token = localStorage.getItem("chainvote_token");
    const user  = JSON.parse(localStorage.getItem("chainvote_user") || "null");
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }) {
  const persisted = loadPersisted();

  const [user,  setUser]  = useState(persisted.user);
  const [token, setToken] = useState(persisted.token);
  const [loading, setLoading] = useState(false);

  // ── Persist helpers ────────────────────────────────────────────────────
  const persist = useCallback((newToken, newUser) => {
    localStorage.setItem("chainvote_token", newToken);
    localStorage.setItem("chainvote_user",  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("chainvote_token");
    localStorage.removeItem("chainvote_user");
    setToken(null);
    setUser(null);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(formData);
      persist(res.token, res.user);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || "Registration failed." };
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const res = await authAPI.login(credentials);
      persist(res.token, res.user);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || "Login failed." };
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  // After voting, update the local user state so UI reflects hasVoted=true
  const markVoted = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, hasVoted: true };
      localStorage.setItem("chainvote_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────
  const isAuthenticated = Boolean(token && user);
  const isAdmin         = user?.role === "admin";
  const isVoter         = user?.role === "voter";

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isVoter,
    register,
    login,
    logout,
    markVoted,
  }), [user, token, loading, isAuthenticated, isAdmin, isVoter, register, login, logout, markVoted]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};