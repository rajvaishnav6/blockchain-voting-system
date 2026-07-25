/**
 * pages/Login.jsx
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiZap, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors]   = useState({});

  const from = location.state?.from?.pathname || null;

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = "Email is required.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const res = await login({ email: form.email, password: form.password });
    if (res.success) {
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
      const dest = from || (res.user.role === "admin" ? "/admin" : "/dashboard");
      navigate(dest, { replace: true });
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 pt-20">
      <div className="w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 border rounded-xl bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan">
            <FiZap size={22} />
          </div>
          <h1 className="mb-1 text-2xl font-bold font-heading text-cyber-text">Sign in to ChainVote</h1>
          <p className="text-sm text-cyber-muted">Access your voter account</p>
        </div>

        {/* Card */}
        <div className="p-8 cyber-card">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="cyber-label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-cyber-muted" size={15} />
                <input
                  type="email"
                  className={`cyber-input pl-9 ${errors.email ? "border-cyber-red/60" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-cyber-red">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="cyber-label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3.5 text-cyber-muted" size={15} />
                <input
                  type={showPwd ? "text" : "password"}
                  className={`cyber-input pl-9 pr-10 ${errors.password ? "border-cyber-red/60" : ""}`}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-cyber-muted hover:text-cyber-text transition-colors"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-cyber-red">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full border-cyber-bg border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Admin hint */}
          <div className="p-3 mt-5 font-mono text-xs border rounded-lg bg-cyber-border/30 border-cyber-border text-cyber-muted">
            <strong className="text-cyber-cyan">Demo admin:</strong> admin@voting.com / admin123
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-sm text-center text-cyber-muted">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-cyber-cyan hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}