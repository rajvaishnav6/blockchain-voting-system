import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { voteAPI } from "../utils/api";
import toast from "react-hot-toast";
import { FiZap, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { LoadingSpinner } from "../components/LoadingSpinner";

export default function Vote() {
  const { user, markVoted } = useAuth();
  const { isConnected, connectWallet, castVoteOnChain, walletAddress, networkError } = useWeb3();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [electionStatus, setElectionStatus] = useState({ started: false, ended: false });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await voteAPI.getCandidates();
        setCandidates(res.candidates || []);
        setElectionStatus(res.electionStatus || { started: false, ended: false });
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchCandidates();
  }, []);

  const handleVote = async () => {
    if (!selected) return toast.error("Please select a candidate first!");
    if (!isConnected) return toast.error("Connect your MetaMask wallet first!");
    if (user?.hasVoted) return toast.error("You have already voted!");

    setVoting(true);
    try {
      // Step 1: Send vote to blockchain via MetaMask
      const { txHash: hash } = await castVoteOnChain(selected);

      // Step 2: Record in backend
      await voteAPI.vote({
        candidateId:   selected,
        txHash:        hash,
        walletAddress: walletAddress,
      });

      setTxHash(hash);
      markVoted(); // Update local auth state
      toast.success("🎉 Vote cast successfully on blockchain!");
    } catch (err) {
      const msg = err?.message || err?.reason || "Vote failed. Please try again.";
      toast.error(msg);
    } finally {
      setVoting(false);
    }
  };

  // Already voted success screen
  if (txHash || user?.hasVoted) {
    return (
      <div className="flex items-center justify-center page-container">
        <div className="max-w-md p-10 text-center cyber-card">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 border rounded-full bg-cyber-green/10 border-cyber-green/20 text-cyber-green">
            <FiCheckCircle size={28} />
          </div>
          <h2 className="mb-3 text-2xl font-bold font-heading text-cyber-text">
            Vote Recorded!
          </h2>
          <p className="mb-6 text-cyber-muted">
            Your vote is permanently stored on the Ethereum blockchain.
          </p>
          {txHash && (
            <div className="mb-6">
              <p className="mb-1 cyber-label">Transaction Hash</p>
              <p className="hash-display">{txHash}</p>
            </div>
          )}
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate("/results")} className="btn-primary">
              View Results
            </button>
            <button onClick={() => navigate("/profile")} className="btn-ghost">
              My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-container"><LoadingSpinner message="Loading candidates..." /></div>;

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto content-wrapper">
        <h1 className="mb-1 section-title">Cast Your Vote</h1>
        <p className="mb-8 text-cyber-muted">Select a candidate and confirm with MetaMask</p>

        {/* Warnings */}
        {networkError && (
          <div className="p-4 mb-6 cyber-card border-cyber-red/20 bg-cyber-red/5">
            <p className="flex items-center gap-2 text-sm text-cyber-red">
              <FiAlertTriangle /> {networkError}
            </p>
          </div>
        )}

        {!electionStatus.started && (
          <div className="p-5 mb-6 text-center cyber-card border-cyber-yellow/20 bg-cyber-yellow/5">
            <p className="font-semibold text-cyber-yellow font-heading">
              ⏳ Election has not started yet
            </p>
            <p className="mt-1 text-sm text-cyber-muted">Please wait for admin to start the election.</p>
          </div>
        )}

        {electionStatus.ended && (
          <div className="p-5 mb-6 text-center cyber-card border-cyber-red/20 bg-cyber-red/5">
            <p className="font-semibold text-cyber-red font-heading">🔒 Election has ended</p>
            <p className="mt-1 text-sm text-cyber-muted">Voting is no longer possible.</p>
          </div>
        )}

        {/* Wallet Connect */}
        {!isConnected && (
          <div className="p-5 mb-6 cyber-card border-cyber-cyan/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-semibold text-cyber-text font-heading">
                🦊 Connect your MetaMask wallet to vote
              </p>
              <button onClick={connectWallet} className="btn-primary">
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Candidate Selection */}
        {electionStatus.started && !electionStatus.ended && (
          <>
            <div className="mb-8 space-y-3">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left cyber-card p-5 transition-all duration-200 ${
                    selected === c.id
                      ? "border-cyber-cyan/60 bg-cyber-cyan/5 shadow-glow-cyan"
                      : "hover:border-cyber-border/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected === c.id ? "border-cyber-cyan" : "border-cyber-muted"
                    }`}>
                      {selected === c.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan" />
                      )}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 text-lg font-bold border rounded-xl bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan font-heading">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold font-heading text-cyber-text">{c.name}</h3>
                      <p className="text-sm text-cyber-cyan">{c.party}</p>
                    </div>
                    {selected === c.id && (
                      <FiCheckCircle className="ml-auto text-cyber-cyan" size={20} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Vote Button */}
            <div className="p-6 text-center cyber-card">
              {selected && (
                <p className="mb-4 text-sm text-cyber-muted">
                  You selected:{" "}
                  <strong className="text-cyber-cyan">
                    {candidates.find(c => c.id === selected)?.name}
                  </strong>
                </p>
              )}
              <button
                onClick={handleVote}
                disabled={!selected || !isConnected || voting}
                className="btn-primary px-10 py-3.5"
              >
                {voting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 rounded-full border-cyber-bg border-t-transparent animate-spin" />
                    Processing on Blockchain…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiZap /> Cast Vote on Blockchain
                  </span>
                )}
              </button>
              <p className="mt-3 text-xs text-cyber-muted">
                MetaMask will open — confirm the transaction to vote
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}