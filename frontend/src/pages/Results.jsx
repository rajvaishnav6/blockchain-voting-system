import { useEffect, useState } from "react";
import { voteAPI } from "../utils/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { FiAward, FiRefreshCw } from "react-icons/fi";

const COLORS = ["#00d4ff", "#00ff88", "#7c3aed", "#ffc107", "#ff4466"];

export default function Results() {
  const [results, setResults]   = useState([]);
  const [totalVotes, setTotal]  = useState(0);
  const [winner, setWinner]     = useState(null);
  const [electionStatus, setStatus] = useState({ started: false, ended: false });
  const [loading, setLoading]   = useState(true);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await voteAPI.getResults();
      setResults(res.results   || []);
      setTotal(res.totalVotes  || 0);
      setWinner(res.winner     || null);
      setStatus(res.electionStatus || { started: false, ended: false });
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResults(); }, []);

  const chartData = results.map(r => ({
    name:  r.name.split(" ")[0],
    votes: r.votes,
    pct:   r.percentage,
  }));

  return (
    <div className="page-container">
      <div className="content-wrapper">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-1 section-title">Election Results</h1>
            <p className="text-cyber-muted">Live results from the blockchain</p>
          </div>
          <div className="flex items-center gap-3">
            {electionStatus.ended   && <span className="badge-red">Final Results</span>}
            {electionStatus.started && !electionStatus.ended && <span className="badge-green">Live 🔴</span>}
            {!electionStatus.started && <span className="badge-yellow">Not Started</span>}
            <button onClick={fetchResults} className="px-3 py-2 text-xs btn-ghost">
              <FiRefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Total Votes */}
        <div className="p-5 mb-6 text-center cyber-card">
          <p className="cyber-label">Total Votes Cast</p>
          <p className="text-4xl font-bold font-heading text-cyber-cyan">{totalVotes}</p>
        </div>

        {/* Winner Banner */}
        {winner && electionStatus.ended && (
          <div className="p-6 mb-6 text-center cyber-card border-cyber-yellow/30 bg-cyber-yellow/5">
            <FiAward size={28} className="mx-auto mb-2 text-cyber-yellow" />
            <p className="mb-1 text-xl font-bold font-heading text-cyber-text">
              🏆 Winner: {winner.name}
            </p>
            <p className="text-cyber-muted">{winner.party} — {winner.votes} votes</p>
          </div>
        )}

        {loading ? <LoadingSpinner message="Fetching results from blockchain..." /> : (
          <>
            {/* Chart */}
            {results.length > 0 && (
              <div className="p-6 mb-6 cyber-card">
                <h2 className="mb-4 font-semibold font-heading text-cyber-text">Vote Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7a9e", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7a9e", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#0d1224", border: "1px solid #1a2540",
                        borderRadius: "8px", color: "#e0e8ff"
                      }}
                    />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Results Table */}
            <div className="overflow-hidden cyber-card">
              <div className="p-5 border-b border-cyber-border">
                <h2 className="font-semibold font-heading text-cyber-text">Candidate Standings</h2>
              </div>
              <div className="divide-y divide-cyber-border">
                {results.map((r, i) => (
                  <div key={r.id} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold ${
                          i === 0 ? "bg-cyber-yellow/20 text-cyber-yellow" : "bg-cyber-border text-cyber-muted"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold font-heading text-cyber-text">{r.name}</p>
                          <p className="text-xs text-cyber-cyan">{r.party}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-heading text-cyber-text">{r.votes}</p>
                        <p className="text-xs text-cyber-muted">{r.percentage}%</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${r.percentage}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="p-10 text-center text-cyber-muted">
                    No votes cast yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}