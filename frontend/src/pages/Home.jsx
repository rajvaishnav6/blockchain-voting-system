/**
 * pages/Home.jsx — Landing page
 */

import { Link } from "react-router-dom";
import {
  FiShield, FiZap, FiEye, FiLock, FiArrowRight, FiCheckCircle
} from "react-icons/fi";

const features = [
  {
    icon: <FiShield size={22} />,
    title: "Tamper-Proof Votes",
    desc:  "Every vote is stored on the Ethereum blockchain — immutable, transparent, and verifiable by anyone.",
    color: "text-cyber-cyan",
    bg:    "bg-cyber-cyan/10 border-cyber-cyan/20",
  },
  {
    icon: <FiLock size={22} />,
    title: "One Person, One Vote",
    desc:  "Smart contract logic and JWT authentication prevent double voting at both the blockchain and database layers.",
    color: "text-cyber-green",
    bg:    "bg-cyber-green/10 border-cyber-green/20",
  },
  {
    icon: <FiZap size={22} />,
    title: "MetaMask Integration",
    desc:  "Connect your wallet and sign your vote transaction. You own your vote — just like your crypto assets.",
    color: "text-yellow-400",
    bg:    "bg-yellow-400/10 border-yellow-400/20",
  },
  {
    icon: <FiEye size={22} />,
    title: "Real-Time Results",
    desc:  "Results are computed directly from the blockchain. No black boxes — every vote count is publicly auditable.",
    color: "text-cyber-purple",
    bg:    "bg-cyber-purple/10 border-cyber-purple/20",
  },
];

const steps = [
  { n: "01", title: "Register",       desc: "Create your voter account with a secure password." },
  { n: "02", title: "Connect Wallet", desc: "Link your MetaMask wallet to your voter identity." },
  { n: "03", title: "Cast Your Vote", desc: "Select a candidate and sign the transaction in MetaMask." },
  { n: "04", title: "View Results",   desc: "Watch live results update directly from the blockchain." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-32 pb-24 overflow-hidden">
        {/* background glow blobs */}
        <div className="absolute rounded-full pointer-events-none top-20 left-1/4 w-96 h-96 bg-cyber-cyan/5 blur-3xl" />
        <div className="absolute rounded-full pointer-events-none top-40 right-1/4 w-80 h-80 bg-cyber-purple/5 blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-cyan/20 bg-cyber-cyan/5 text-cyber-cyan text-xs font-heading font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse" />
            Powered by Ethereum & Smart Contracts
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6 text-balance">
            Democracy, <br />
            <span className="text-transparent bg-gradient-to-r from-cyber-cyan via-white to-cyber-cyan bg-clip-text">
              on the blockchain.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mb-10 text-lg leading-relaxed text-cyber-muted sm:text-xl">
            ChainVote brings cryptographic security and radical transparency to
            elections. Every vote is signed by the voter's wallet, stored
            immutably on Ethereum, and auditable by anyone — forever.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Start Voting <FiArrowRight />
            </Link>
            <Link to="/results"  className="btn-ghost text-base px-8 py-3.5">
              View Results
            </Link>
          </div>

          {/* trust bullets */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-cyber-muted">
            {["JWT authentication", "bcrypt password hashing", "Solidity smart contract", "Ganache local blockchain"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <FiCheckCircle size={13} className="text-cyber-green" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 border-t border-cyber-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-2 text-center section-title">
            Built for trust. Designed for everyone.
          </h2>
          <p className="mb-12 text-center text-cyber-muted">
            Every layer of ChainVote is engineered for security and transparency.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="p-6 cyber-card-hover">
                <div className={`w-11 h-11 rounded-lg border flex items-center justify-center mb-4 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold font-heading text-cyber-text">{f.title}</h3>
                <p className="text-sm leading-relaxed text-cyber-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-4 py-20 border-t border-cyber-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="mb-2 text-center section-title">How it works</h2>
          <p className="mb-12 text-center text-cyber-muted">Four steps to a secure, verified vote.</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-12px)] w-full h-px bg-gradient-to-r from-cyber-border to-transparent z-0" />
                )}
                <div className="relative z-10 p-5 cyber-card">
                  <div className="mb-3 font-mono text-xs text-cyber-cyan">{s.n}</div>
                  <h3 className="mb-2 font-semibold font-heading text-cyber-text">{s.title}</h3>
                  <p className="text-sm text-cyber-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 border-t border-cyber-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="mb-4 section-title">Your vote is your voice.</h2>
          <p className="mb-8 text-cyber-muted">
            Register now and exercise your right to vote — with cryptographic certainty
            that your choice is counted exactly once, exactly as you intended.
          </p>
          <Link to="/register" className="btn-primary text-base px-8 py-3.5">
            Create Account <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-4 py-8 mt-auto border-t border-cyber-border">
        <div className="flex flex-col items-center justify-between max-w-6xl gap-4 mx-auto text-sm sm:flex-row text-cyber-muted">
          <span className="font-semibold font-heading text-cyber-text">
            ⚡ ChainVote
          </span>
          <span>Blockchain-Based Secure Voting System · Built with Ethereum + React</span>
        </div>
      </footer>
    </div>
  );
}