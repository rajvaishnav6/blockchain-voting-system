/**
 * App.jsx — Root component: defines all application routes.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar  from "./components/Navbar.jsx";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute.jsx";

// Lazy-load pages for better bundle splitting
import Home              from "./pages/Home.jsx";
import Login             from "./pages/Login.jsx";
import Register          from "./pages/Register.jsx";
import Dashboard         from "./pages/Dashboard.jsx";
import Candidates        from "./pages/Candidates.jsx";
import Vote              from "./pages/Vote.jsx";
import Results           from "./pages/Results.jsx";
import AdminDashboard    from "./pages/AdminDashboard.jsx";
import Profile           from "./pages/Profile.jsx";
import TransactionDetails from "./pages/TransactionDetails.jsx";

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-cyber-bg grid-bg bg-grid-40">
      <Navbar />

      <main>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────────── */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={
            isAuthenticated
              ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
              : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Register />
          } />
          <Route path="/results"  element={<Results />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/transaction/:txHash" element={<TransactionDetails />} />

          {/* ── Voter-protected routes ─────────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/vote" element={
            <ProtectedRoute><Vote /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* ── Admin-only routes ──────────────────────────────────────── */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />

          {/* ── 404 catch-all ─────────────────────────────────────────── */}
          <Route path="*" element={
            <div className="flex items-center justify-center page-container">
              <div className="text-center">
                <p className="mb-4 text-6xl font-bold font-heading text-cyber-cyan">404</p>
                <p className="mb-6 text-cyber-muted">Page not found.</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}