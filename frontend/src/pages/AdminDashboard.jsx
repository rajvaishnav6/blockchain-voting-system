import { useEffect, useState } from "react";
import { adminAPI, voteAPI } from "../utils/api";
import toast from "react-hot-toast";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  FiUsers, FiList, FiPlay, FiSquare, FiPlus, FiRefreshCw, FiTrash2, FiAward
} from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [form, setForm]           = useState({ name: "", party: "", description: "" });
  const [adding, setAdding]       = useState(false);
  const [acting, setActing]       = useState(false);
  const [resetting, setResetting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.stats);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const fetchCandidates = async () => {
    try {
      const res = await voteAPI.getCandidates();
      setCandidates(res.candidates || []);
    } catch (_) {}
    finally { setCandidatesLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchCandidates();
  }, []);

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.party) return toast.error("Name and party required!");
    setAdding(true);
    try {
      await adminAPI.addCandidate(form);
      toast.success(`Candidate "${form.name}" added!`);
      setForm({ name: "", party: "", description: "" });
      fetchCandidates();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Failed to add candidate.");
    } finally { setAdding(false); }
  };

  const handleRemoveCandidate = async (id, name) => {
    if (!window.confirm(`Remove "${name}"? This cannot be undone.`)) return;
    setRemovingId(id);
    try {
      await adminAPI.removeCandidate(id);
      toast.success(`"${name}" removed successfully.`);
      fetchCandidates();
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not remove candidate.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleStart = async () => {
    setActing(true);
    try {
      await adminAPI.startElection();
      toast.success("Election started!");
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not start election.");
    } finally { setActing(false); }
  };

  const handleEnd = async () => {
    setActing(true);
    try {
      await adminAPI.endElection();
      toast.success("Election ended! Results are final.");
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Could not end election.");
    } finally { setActing(false); }
  };

  const handleReset = async () => {
    if (!window.confirm("This will clear all votes and let everyone vote again. Continue?")) {
      return;
    }
    setResetting(true);
    try {
      await adminAPI.resetElection();
      toast.success("Election reset! Ready for a fresh round.");
      fetchStats();
      fetchCandidates();
    } catch (err) {
      toast.error(err.message || "Could not reset election.");
    } finally { setResetting(false); }
  };

  if (loading) return <div className="page-container"><LoadingSpinner message="Loading admin panel..." /></div>;

  const es = stats?.electionStatus || {};
  const canManageCandidates = !es.started && !es.ended;

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <h1 className="mb-1 section-title">Admin Dashboard</h1>
        <p className="mb-8 text-cyber-muted">Manage candidates and election lifecycle</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[
            { label: "Total Voters",     value: stats?.totalVoters,     icon: <FiUsers size={16} /> },
            { label: "Votes Cast",       value: stats?.votedCount,      icon: <FiList size={16} />  },
            { label: "Not Voted",        value: stats?.notVotedCount,   icon: <FiUsers size={16} /> },
            { label: "Turnout",          value: `${stats?.turnoutPercent}%`, icon: <FiList size={16} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center gap-2 mb-1 text-cyber-muted">
                {icon}
                <span className="m-0 cyber-label">{label}</span>
              </div>
              <p className="text-2xl font-bold font-heading text-cyber-cyan">{value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Election Control */}
        <div className="p-6 mb-6 cyber-card">
          <h2 className="mb-4 font-semibold font-heading text-cyber-text">Election Control</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="m-0 cyber-label">Status:</span>
              {es.ended   && <span className="badge-red">Ended</span>}
              {es.started && !es.ended && <span className="badge-green">Live 🔴</span>}
              {!es.started && <span className="badge-yellow">Not Started</span>}
            </div>
            <div className="flex flex-wrap gap-3 ml-auto">
              {!es.started && !es.ended && (
                <button onClick={handleStart} disabled={acting} className="btn-primary">
                  <FiPlay size={14} /> Start Election
                </button>
              )}
              {es.started && !es.ended && (
                <button onClick={handleEnd} disabled={acting} className="btn-danger">
                  <FiSquare size={14} /> End Election
                </button>
              )}
              <button onClick={handleReset} disabled={resetting} className="btn-ghost">
                <FiRefreshCw size={14} /> {resetting ? "Resetting..." : "Reset Election"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-cyber-muted">
            "Reset Election" clears all votes and lets everyone vote again — no redeploy needed.
          </p>
        </div>

        {/* Candidates Management */}
        <div className="p-6 mb-6 cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-heading text-cyber-text">Manage Candidates</h2>
            <span className="badge-cyan"><FiAward size={11} /> {candidates.length} Active</span>
          </div>

          {candidatesLoading ? (
            <LoadingSpinner size="sm" />
          ) : candidates.length === 0 ? (
            <p className="mb-4 text-sm text-cyber-muted">No candidates added yet. Add one below.</p>
          ) : (
            <div className="mb-6 space-y-2">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-cyber-bg border-cyber-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center text-sm font-bold border rounded-lg w-9 h-9 bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan font-heading">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-heading text-cyber-text">{c.name}</p>
                      <p className="text-xs text-cyber-cyan">{c.party}</p>
                    </div>
                  </div>

                  {canManageCandidates ? (
                    <button
                      onClick={() => handleRemoveCandidate(c.id, c.name)}
                      disabled={removingId === c.id}
                      className="btn-danger px-3 py-1.5 text-xs"
                      title="Remove candidate"
                    >
                      <FiTrash2 size={13} />
                      {removingId === c.id ? "Removing..." : "Remove"}
                    </button>
                  ) : (
                    <span className="text-xs badge-muted">{c.votes || 0} votes</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!canManageCandidates && (
            <p className="mb-4 text-xs text-cyber-yellow">
              Candidates can only be added or removed before the election starts. Reset the election to make changes.
            </p>
          )}

          {/* Add Candidate Form */}
          {canManageCandidates && (
            <form onSubmit={handleAddCandidate} className="pt-4 space-y-4 border-t border-cyber-border">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="cyber-label">Candidate Name</label>
                  <input
                    className="cyber-input"
                    placeholder="Full name"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="cyber-label">Party</label>
                  <input
                    className="cyber-input"
                    placeholder="Political party"
                    value={form.party}
                    onChange={e => setForm(p => ({ ...p, party: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="cyber-label">Description (Optional)</label>
                <input
                  className="cyber-input"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={adding} className="btn-primary">
                <FiPlus size={14} />
                {adding ? "Adding..." : "Add Candidate"}
              </button>
            </form>
          )}
        </div>

        {/* Recent Votes */}
        {stats?.recentVotes?.length > 0 && (
          <div className="overflow-hidden cyber-card">
            <div className="p-5 border-b border-cyber-border">
              <h2 className="font-semibold font-heading text-cyber-text">Recent Votes</h2>
            </div>
            <div className="divide-y divide-cyber-border">
              {stats.recentVotes.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-semibold font-heading text-cyber-text">
                      {v.candidateName}
                    </p>
                    <p className="font-mono text-xs text-cyber-muted">
                      {v.walletAddress?.slice(0, 10)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyber-muted">
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs hash-display">
                      {v.txHash?.slice(0, 16)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}