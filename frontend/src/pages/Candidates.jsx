import { useEffect, useState } from "react";
import { voteAPI } from "../utils/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { FiUser, FiAward } from "react-icons/fi";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [electionStatus, setElectionStatus] = useState({ started: false, ended: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await voteAPI.getCandidates();
        setCandidates(res.candidates || []);
        setElectionStatus(res.electionStatus || { started: false, ended: false });
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-1 section-title">Candidates</h1>
            <p className="text-cyber-muted">All registered candidates for this election</p>
          </div>
          <div>
            {electionStatus.ended   && <span className="badge-red">Election Ended</span>}
            {electionStatus.started && !electionStatus.ended && <span className="badge-green">Election Live 🔴</span>}
            {!electionStatus.started && <span className="badge-yellow">Not Started</span>}
          </div>
        </div>

        {loading ? <LoadingSpinner message="Loading candidates..." /> : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c, i) => (
              <div key={c.id} className="p-6 cyber-card-hover">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center text-xl font-bold border w-14 h-14 rounded-xl bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan font-heading">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold font-heading text-cyber-text">{c.name}</h3>
                    <p className="text-sm text-cyber-cyan">{c.party}</p>
                  </div>
                </div>
                {c.description && (
                  <p className="mb-4 text-sm leading-relaxed text-cyber-muted">{c.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-cyber-border">
                  <span className="text-xs text-cyber-muted">Candidate #{i + 1}</span>
                  <span className="badge-cyan">
                    <FiAward size={11} /> {c.votes || 0} votes
                  </span>
                </div>
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="col-span-3 py-16 text-center text-cyber-muted">
                <FiUser size={32} className="mx-auto mb-3 opacity-30" />
                <p>No candidates registered yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}