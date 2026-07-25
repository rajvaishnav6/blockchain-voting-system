import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { authAPI } from "../utils/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { FiUser, FiMail, FiCheckCircle, FiExternalLink } from "react-icons/fi";

export default function Profile() {
  const { user } = useAuth();
  const { walletAddress, isConnected, connectWallet } = useWeb3();
  const [profile, setProfile]     = useState(null);
  const [voteRecord, setVoteRecord] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await authAPI.profile();
        setProfile(res.user);
        setVoteRecord(res.voteRecord);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-container"><LoadingSpinner message="Loading profile..." /></div>;

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto content-wrapper">
        <h1 className="mb-8 section-title">My Profile</h1>

        {/* Profile Card */}
        <div className="p-8 mb-6 cyber-card">
          <div className="flex items-center gap-5 mb-6">
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold border rounded-2xl bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan font-heading">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-cyber-text">{user?.name}</h2>
              <span className={user?.role === "admin" ? "badge-cyan" : "badge-muted"}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-cyber-bg border-cyber-border">
              <FiUser size={15} className="text-cyber-muted" />
              <div>
                <p className="cyber-label">Name</p>
                <p className="text-sm text-cyber-text">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-cyber-bg border-cyber-border">
              <FiMail size={15} className="text-cyber-muted" />
              <div>
                <p className="cyber-label">Email</p>
                <p className="text-sm text-cyber-text">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="p-6 mb-6 cyber-card">
          <h3 className="mb-4 font-semibold font-heading text-cyber-text">🦊 MetaMask Wallet</h3>
          {isConnected ? (
            <div className="p-3 border rounded-lg bg-cyber-green/5 border-cyber-green/20">
              <p className="cyber-label">Connected Wallet</p>
              <p className="mt-1 hash-display">{walletAddress}</p>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="mb-3 text-sm text-cyber-muted">No wallet connected</p>
              <button onClick={connectWallet} className="btn-primary">
                Connect MetaMask
              </button>
            </div>
          )}
        </div>

        {/* Vote Record */}
        <div className="p-6 cyber-card">
          <h3 className="mb-4 font-semibold font-heading text-cyber-text">🗳️ Vote Record</h3>
          {voteRecord ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <FiCheckCircle className="text-cyber-green" />
                <span className="font-semibold text-cyber-green font-heading">Vote cast successfully</span>
              </div>
              <div className="p-3 border rounded-lg bg-cyber-bg border-cyber-border">
                <p className="cyber-label">Voted For</p>
                <p className="font-semibold text-cyber-text">{voteRecord.candidateName}</p>
                <p className="text-sm text-cyber-cyan">{voteRecord.party}</p>
              </div>
              <div className="p-3 border rounded-lg bg-cyber-bg border-cyber-border">
                <p className="cyber-label">Transaction Hash</p>
                <p className="mt-1 hash-display">{voteRecord.txHash}</p>
              </div>
              <div className="p-3 border rounded-lg bg-cyber-bg border-cyber-border">
                <p className="cyber-label">Timestamp</p>
                <p className="text-sm text-cyber-text">
                  {new Date(voteRecord.timestamp).toLocaleString()}
                </p>
              </div>
              <Link
                to={`/transaction/${voteRecord.txHash}`}
                className="justify-center w-full mt-2 btn-ghost"
              >
                <FiExternalLink size={14} /> View on Blockchain
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="mb-4 text-cyber-muted">You haven't voted yet.</p>
              <Link to="/vote" className="btn-primary">Cast Your Vote</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}