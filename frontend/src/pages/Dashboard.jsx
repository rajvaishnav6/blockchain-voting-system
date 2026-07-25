import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { voteAPI } from "../utils/api";
import { FiZap, FiCheckCircle, FiList, FiBarChart2, FiAlertCircle } from "react-icons/fi";

export default function Dashboard() {
  const { user } = useAuth();
  const { isConnected, walletAddress, connectWallet } = useWeb3();
  const [electionStatus, setElectionStatus] = useState({ started: false, ended: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await voteAPI.getCandidates();
        setElectionStatus(res.electionStatus || { started: false, ended: false });
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchStatus();
  }, []);

  const getStatusBadge = () => {
    if (electionStatus.ended)   return <span className="badge-red">Election Ended</span>;
    if (electionStatus.started) return <span className="badge-green">Election Live 🔴</span>;
    return <span className="badge-yellow">Not Started Yet</span>;
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold font-heading text-cyber-text">
            Welcome back, <span className="text-cyber-cyan">{user?.name?.split(" ")[0]}</span>!
          </h1>
          <p className="text-cyber-muted">Your voter dashboard — ChainVote</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="stat-card">
            <span className="cyber-label">Election Status</span>
            <div className="mt-1">{loading ? "..." : getStatusBadge()}</div>
          </div>
          <div className="stat-card">
            <span className="cyber-label">Vote Status</span>
            <div className="mt-1">
              {user?.hasVoted
                ? <span className="badge-green"><FiCheckCircle size={11} /> Voted</span>
                : <span className="badge-yellow"><FiAlertCircle size={11} /> Not Yet Voted</span>}
            </div>
          </div>
          <div className="stat-card">
            <span className="cyber-label">Wallet</span>
            <div className="mt-1">
              {isConnected
                ? <span className="badge-green">🦊 Connected</span>
                : <span className="badge-muted">Not Connected</span>}
            </div>
          </div>
        </div>

        {/* Wallet Connect Banner */}
        {!isConnected && (
          <div className="p-5 mb-6 cyber-card border-cyber-yellow/20 bg-cyber-yellow/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="mb-1 font-semibold font-heading text-cyber-text">
                  🦊 Connect MetaMask to Vote
                </h3>
                <p className="text-sm text-cyber-muted">
                  You need to connect your wallet to cast a vote on the blockchain.
                </p>
              </div>
              <button onClick={connectWallet} className="btn-primary">
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Already Voted Banner */}
        {user?.hasVoted && (
          <div className="p-5 mb-6 cyber-card border-cyber-green/20 bg-cyber-green/5">
            <div className="flex items-center gap-3">
              <FiCheckCircle size={20} className="text-cyber-green" />
              <div>
                <h3 className="font-heading font-semibold text-cyber-green mb-0.5">
                  Your vote is recorded on the blockchain!
                </h3>
                <p className="text-sm text-cyber-muted">
                  Your vote is immutable and transparent.{" "}
                  <Link to="/profile" className="text-cyber-cyan hover:underline">View details →</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="mb-4 section-title">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              to: "/candidates",
              icon: <FiList size={22} />,
              title: "View Candidates",
              desc: "See all candidates and their details",
              color: "text-cyber-cyan",
              bg: "bg-cyber-cyan/10 border-cyber-cyan/20",
            },
            {
              to: "/vote",
              icon: <FiZap size={22} />,
              title: "Cast Your Vote",
              desc: "Vote securely on the blockchain",
              color: "text-cyber-green",
              bg: "bg-cyber-green/10 border-cyber-green/20",
              disabled: user?.hasVoted || !electionStatus.started || electionStatus.ended,
            },
            {
              to: "/results",
              icon: <FiBarChart2 size={22} />,
              title: "Live Results",
              desc: "View real-time election results",
              color: "text-cyber-purple",
              bg: "bg-cyber-purple/10 border-cyber-purple/20",
            },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.disabled ? "#" : card.to}
              className={`cyber-card-hover p-6 block ${card.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={card.disabled ? (e) => e.preventDefault() : undefined}
            >
              <div className={`w-11 h-11 rounded-lg border flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <h3 className="mb-1 font-semibold font-heading text-cyber-text">{card.title}</h3>
              <p className="text-sm text-cyber-muted">{card.desc}</p>
              {card.disabled && card.to === "/vote" && (
                <p className="mt-2 text-xs text-cyber-yellow">
                  {user?.hasVoted ? "Already voted" : !electionStatus.started ? "Election not started" : "Election ended"}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}