/**
 * components/Navbar.jsx
 * Main navigation bar with auth state, MetaMask connection, and mobile menu.
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import {
  FiMenu, FiX, FiZap, FiLogOut, FiUser, FiGrid, FiList,
  FiBarChart2, FiShield, FiFileText
} from "react-icons/fi";
import toast from "react-hot-toast";

const truncateAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isConnected, walletAddress, connectWallet, disconnectWallet, isConnecting } = useWeb3();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    toast.success("Logged out successfully.");
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Navigation links based on role
  const voterLinks = [
    { to: "/dashboard",    label: "Dashboard",   icon: <FiGrid size={15} /> },
    { to: "/candidates",   label: "Candidates",  icon: <FiList size={15} /> },
    { to: "/vote",         label: "Vote",        icon: <FiZap size={15} /> },
    { to: "/results",      label: "Results",     icon: <FiBarChart2 size={15} /> },
    { to: "/profile",      label: "Profile",     icon: <FiUser size={15} /> },
  ];

  const adminLinks = [
    { to: "/admin",        label: "Admin Panel", icon: <FiShield size={15} /> },
    { to: "/candidates",   label: "Candidates",  icon: <FiList size={15} /> },
    { to: "/results",      label: "Results",     icon: <FiBarChart2 size={15} /> },
  ];

  const links = isAdmin ? adminLinks : voterLinks;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold transition-colors font-heading text-cyber-text hover:text-cyber-cyan"
        >
          <span className="flex items-center justify-center border rounded-md w-7 h-7 bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan">
            <FiZap size={14} />
          </span>
          Chain<span className="text-cyber-cyan">Vote</span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────────────── */}
        {isAuthenticated && (
          <div className="items-center hidden gap-1 md:flex">
            {links.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body transition-colors ${
                  isActive(to)
                    ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                }`}
              >
                {icon} {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right actions ─────────────────────────────────────────────── */}
        <div className="items-center hidden gap-3 md:flex">
          {isAuthenticated ? (
            <>
              {/* MetaMask connect */}
              {!isAdmin && (
                isConnected ? (
                  <button
                    onClick={disconnectWallet}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-green/30 bg-cyber-green/5 text-cyber-green text-xs font-mono hover:bg-cyber-green/10 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                    {truncateAddress(walletAddress)}
                  </button>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="btn-ghost text-xs px-4 py-1.5"
                  >
                    {isConnecting ? "Connecting…" : "🦊 Connect Wallet"}
                  </button>
                )
              )}

              {/* User greeting */}
              <span className="text-sm text-cyber-muted">
                {user?.name?.split(" ")[0]}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/5 transition-colors"
              >
                <FiLogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="px-4 py-2 text-sm btn-ghost">Login</Link>
              <Link to="/register" className="px-4 py-2 text-sm btn-primary">Register</Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────────────── */}
        <button
          className="transition-colors md:hidden text-cyber-muted hover:text-cyber-text"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="flex flex-col gap-2 px-4 py-4 border-t md:hidden border-cyber-border bg-cyber-bg/95 backdrop-blur-md">
          {isAuthenticated ? (
            <>
              {links.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                    isActive(to)
                      ? "bg-cyber-cyan/10 text-cyber-cyan"
                      : "text-cyber-muted hover:text-cyber-text"
                  }`}
                >
                  {icon} {label}
                </Link>
              ))}

              {!isAdmin && !isConnected && (
                <button
                  onClick={() => { connectWallet(); setMenuOpen(false); }}
                  className="mt-2 text-sm btn-ghost"
                >
                  🦊 Connect Wallet
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 mt-2 text-sm rounded-md text-cyber-muted hover:text-cyber-red"
              >
                <FiLogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)} className="text-sm btn-ghost">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="mt-1 text-sm btn-primary">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}