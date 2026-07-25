import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { voteAPI } from "../utils/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function TransactionDetails() {
  const { txHash } = useParams();
  const [tx, setTx]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await voteAPI.getTransaction(txHash);
        setTx(res.transaction);
      } catch (e) {
        setError(e.message || "Transaction not found.");
      } finally { setLoading(false); }
    };
    fetch();
  }, [txHash]);

  if (loading) return <div className="page-container"><LoadingSpinner message="Fetching transaction..." /></div>;

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto content-wrapper">
        <Link to="/profile" className="inline-flex items-center gap-2 mb-6 text-sm transition-colors text-cyber-muted hover:text-cyber-text">
          <FiArrowLeft size={14} /> Back to Profile
        </Link>

        <h1 className="mb-8 section-title">Transaction Details</h1>

        {error ? (
          <div className="p-8 text-center cyber-card">
            <FiXCircle size={32} className="mx-auto mb-3 text-cyber-red" />
            <p className="text-cyber-muted">{error}</p>
          </div>
        ) : tx ? (
          <div className="overflow-hidden cyber-card">
            <div className="flex items-center gap-3 p-5 border-b border-cyber-border">
              {tx.status === "Success"
                ? <FiCheckCircle className="text-cyber-green" size={18} />
                : <FiXCircle className="text-cyber-red" size={18} />}
              <span className={`font-heading font-semibold ${
                tx.status === "Success" ? "text-cyber-green" : "text-cyber-red"
              }`}>
                {tx.status}
              </span>
            </div>

            <div className="divide-y divide-cyber-border">
              {[
                { label: "Transaction Hash", value: tx.hash,        mono: true },
                { label: "From (Voter)",     value: tx.from,        mono: true },
                { label: "To (Contract)",    value: tx.to,          mono: true },
                { label: "Block Number",     value: tx.blockNumber  },
                { label: "Gas Used",         value: tx.gasUsed      },
                { label: "Timestamp",        value: tx.timestamp
                    ? new Date(tx.timestamp).toLocaleString()
                    : "—" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="p-5">
                  <p className="mb-1 cyber-label">{label}</p>
                  {mono
                    ? <p className="hash-display">{value}</p>
                    : <p className="font-mono text-sm text-cyber-text">{value ?? "—"}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}