import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiZap, FiEye, FiEyeOff } from "react-icons/fi";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name)     e.name    = "Name is required.";
    if (!form.email)    e.email   = "Email is required.";
    if (!form.password) e.password = "Password is required.";
    if (form.password.length < 6) e.password = "Minimum 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await register({
      name: form.name, email: form.email, password: form.password
    });
    if (res.success) {
      toast.success("Account created! Welcome to ChainVote!");
      navigate("/dashboard");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 border rounded-xl bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan">
            <FiZap size={22} />
          </div>
          <h1 className="mb-1 text-2xl font-bold font-heading text-cyber-text">Create Your Account</h1>
          <p className="text-sm text-cyber-muted">Join ChainVote — secure blockchain voting</p>
        </div>

        <div className="p-8 cyber-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="cyber-label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3.5 text-cyber-muted" size={15} />
                <input
                  type="text"
                  className={`cyber-input pl-9 ${errors.name ? "border-cyber-red/60" : ""}`}
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-cyber-red">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="cyber-label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-cyber-muted" size={15} />
                <input
                  type="email"
                  className={`cyber-input pl-9 ${errors.email ? "border-cyber-red/60" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
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
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button"
                  className="absolute right-3 top-3.5 text-cyber-muted hover:text-cyber-text"
                  onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-cyber-red">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="cyber-label">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3.5 text-cyber-muted" size={15} />
                <input
                  type={showPwd ? "text" : "password"}
                  className={`cyber-input pl-9 ${errors.confirm ? "border-cyber-red/60" : ""}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-cyber-red">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-2 btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full border-cyber-bg border-t-transparent animate-spin" />
                  Creating Account…
                </span>
              ) : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-center text-cyber-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-cyber-cyan hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}