/**
 * controllers/adminController.js
 * Admin-only actions: add/remove candidates, start/end/reset election.
 */

const { pool }   = require("../config/database");
const { ethers } = require("ethers");
const fs         = require("fs");
const path       = require("path");

const contractPath = path.join(__dirname, "../../frontend/src/contracts/VotingSystem.json");
let CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
let CONTRACT_ABI     = [];

try {
  if (fs.existsSync(contractPath)) {
    const data       = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    CONTRACT_ADDRESS = data.address || CONTRACT_ADDRESS;
    CONTRACT_ABI     = data.abi;
  }
} catch (_) {}

const getAdminSigner = () => {
  const provider = new ethers.JsonRpcProvider(
    process.env.GANACHE_URL || "http://127.0.0.1:7545"
  );
  return new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
};

const getContract = (signer) =>
  new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// ── POST /api/admin/addCandidate ─────────────────────────────────────────────
const addCandidate = async (req, res) => {
  try {
    const { name, party, description } = req.body;

    if (!name || !party) {
      return res.status(400).json({
        success: false,
        message: "Candidate name and party are required.",
      });
    }

    let txHash, candidateId;
    try {
      const signer   = getAdminSigner();
      const contract = getContract(signer);
      const tx       = await contract.addCandidate(name.trim(), party.trim());
      const receipt  = await tx.wait();
      txHash = tx.hash;

      const iface = new ethers.Interface(CONTRACT_ABI);
      let parsedId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "CandidateAdded") {
            parsedId = Number(parsed.args.candidateId);
            break;
          }
        } catch (_) {}
      }
      if (parsedId === null) {
        parsedId = Number(await contract.candidateCount());
      }
      candidateId = parsedId;
    } catch (bcErr) {
      console.error("Blockchain addCandidate FAILED:", bcErr);
      return res.status(500).json({
        success: false,
        message: "Could not add candidate to the blockchain. Check Ganache is running and try again.",
      });
    }

    // Blockchain succeeded — mirror it in SQLite.
    // "INSERT OR REPLACE" means: agar is ID ka row pehle se hai
    // (purane test data ki wajah se), toh woh clean overwrite ho jaayega
    // instead of ERROR dena — kyunki blockchain hamesha "sach" hai,
    // SQLite sirf ek mirror/copy hai uska.
    try {
      await pool.execute(
        "INSERT OR REPLACE INTO candidates (id, name, party, description, votes) VALUES (?, ?, ?, ?, 0)",
        [candidateId, name.trim(), party.trim(), description?.trim() || ""]
      );
    } catch (dbErr) {
      // Blockchain pe candidate SAFE hai, chahe yeh mirror-step fail
      // ho jaaye — isliye admin ko "failed" mat batao.
      console.error("SQLite mirror warning (candidate is still on-chain):", dbErr);
    }

    return res.status(201).json({
      success: true,
      message: `Candidate "${name}" added successfully.`,
      candidate: { id: candidateId, name, party, description, votes: 0 },
      txHash,
    });
  } catch (err) {
    console.error("addCandidate error:", err);
    return res.status(500).json({ success: false, message: "Could not add candidate." });
  }
};

// ── DELETE /api/admin/candidate/:id ─────────────────────────────────────────
const removeCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    let txHash;
    try {
      const signer   = getAdminSigner();
      const contract = getContract(signer);
      const tx       = await contract.removeCandidate(id);
      await tx.wait();
      txHash = tx.hash;
    } catch (bcErr) {
      console.error("Blockchain removeCandidate FAILED:", bcErr);
      const msg = bcErr.reason || bcErr.shortMessage || bcErr.message || "";
      if (msg.includes("already started")) {
        return res.status(409).json({
          success: false,
          message: "Cannot remove a candidate after the election has started.",
        });
      }
      if (msg.includes("already removed")) {
        return res.status(409).json({
          success: false,
          message: "This candidate has already been removed.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Could not remove candidate from the blockchain. Check Ganache is running.",
      });
    }

    const [result] = await pool.execute("DELETE FROM candidates WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate removed successfully.",
      txHash,
    });
  } catch (err) {
    console.error("removeCandidate error:", err);
    return res.status(500).json({ success: false, message: "Could not remove candidate." });
  }
};

// ── POST /api/admin/startElection ────────────────────────────────────────────
const startElection = async (req, res) => {
  try {
    const signer   = getAdminSigner();
    const contract = getContract(signer);
    const tx       = await contract.startElection();
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: "Election has been started! Voters can now cast their votes.",
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("startElection error:", err);
    const msg = err.message?.includes("already started")
      ? "Election has already been started."
      : err.message?.includes("no candidates")
      ? "Add at least one candidate before starting the election."
      : err.message?.includes("no active candidates")
      ? "Add at least one active candidate before starting."
      : "Could not start election. Ensure Ganache is running.";
    return res.status(500).json({ success: false, message: msg });
  }
};

// ── POST /api/admin/endElection ──────────────────────────────────────────────
const endElection = async (req, res) => {
  try {
    const signer   = getAdminSigner();
    const contract = getContract(signer);
    const tx       = await contract.endElection();
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: "Election has ended. Results are now final.",
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("endElection error:", err);
    return res.status(500).json({ success: false, message: "Could not end election." });
  }
};

// ── POST /api/admin/resetElection ────────────────────────────────────────────
const resetElection = async (req, res) => {
  try {
    const signer   = getAdminSigner();
    const contract = getContract(signer);
    const tx       = await contract.resetElection();
    await tx.wait();

    await pool.execute("DELETE FROM votes");
    await pool.execute("UPDATE users SET has_voted = 0");
    await pool.execute("UPDATE candidates SET votes = 0");
    await pool.execute("DELETE FROM election_status");
    await pool.execute(
      "INSERT INTO election_status (id, status, tx_hash) VALUES (1, 'not_started', ?)",
      [tx.hash]
    );

    return res.status(200).json({
      success: true,
      message: "Election has been reset! You can start a fresh election now.",
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("resetElection error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not reset election. Make sure Ganache is running.",
    });
  }
};

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [[{ totalVoters }]] = await pool.execute("SELECT COUNT(*) AS totalVoters FROM users");
    const [[{ votedCount }]]  = await pool.execute("SELECT COUNT(*) AS votedCount FROM users WHERE has_voted = 1");
    const [[{ totalCandidates }]] = await pool.execute("SELECT COUNT(*) AS totalCandidates FROM candidates");
    const [recentVotes] = await pool.execute(
      `SELECT v.id, v.tx_hash AS txHash, v.wallet_address AS walletAddress,
              v.created_at AS timestamp, c.name AS candidateName, c.party
       FROM votes v JOIN candidates c ON v.candidate_id = c.id
       ORDER BY v.created_at DESC LIMIT 10`
    );

    let electionStatus = { started: false, ended: false };
    try {
      const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
      const contract  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [started, ended] = await contract.getElectionStatus();
      electionStatus = { started, ended };
    } catch (_) {}

    return res.status(200).json({
      success: true,
      stats: {
        totalVoters:     Number(totalVoters),
        votedCount:      Number(votedCount),
        notVotedCount:   Number(totalVoters) - Number(votedCount),
        turnoutPercent:  totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(1) : "0.0",
        totalCandidates: Number(totalCandidates),
        electionStatus,
        recentVotes,
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch stats." });
  }
};

// ── GET /api/admin/voters ────────────────────────────────────────────────────
const getVoters = async (req, res) => {
  try {
    const [voters] = await pool.execute(
      "SELECT id, name, email, has_voted AS hasVoted, created_at FROM users ORDER BY created_at DESC"
    );
    return res.status(200).json({
      success: true,
      voters: voters.map((v) => ({ ...v, hasVoted: Boolean(v.hasVoted) })),
    });
  } catch (err) {
    console.error("getVoters error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch voters." });
  }
};

module.exports = {
  addCandidate,
  removeCandidate,
  startElection,
  endElection,
  resetElection,
  getStats,
  getVoters,
};