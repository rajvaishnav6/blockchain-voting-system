/**
 * controllers/voteController.js
 * Handles candidate retrieval, vote casting (DB + Blockchain), and results.
 * Blockchain is the SOURCE OF TRUTH — SQLite only adds extra metadata.
 */

const { pool }   = require("../config/database");
const { ethers } = require("ethers");
const fs         = require("fs");
const path       = require("path");

// ── Load contract ABI & address ──────────────────────────────────────────────
const contractPath = path.join(__dirname, "../../frontend/src/contracts/VotingSystem.json");

let CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
let CONTRACT_ABI     = [];

try {
  if (fs.existsSync(contractPath)) {
    const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    CONTRACT_ADDRESS   = contractData.address || CONTRACT_ADDRESS;
    CONTRACT_ABI       = contractData.abi;
  }
} catch (e) {
  console.warn("⚠️  Could not load contract ABI from file, using env vars only.");
}

// ── Blockchain provider (Ganache) ────────────────────────────────────────────
const getProvider = () =>
  new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");

// Read-only contract instance — YEH FUNCTION MISSING THA!
const getContract = (signerOrProvider) =>
  new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);

// ── GET /api/getCandidates ───────────────────────────────────────────────────
const getCandidates = async (req, res) => {
  try {
    let electionStatus    = { started: false, ended: false };
    let onChainCandidates = [];

    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const onChain = await contract.getAllCandidates();
      onChainCandidates = onChain.map((c) => ({
        id:    Number(c.id),
        name:  c.name,
        party: c.party,
        votes: Number(c.voteCount),
      }));

      const [started, ended] = await contract.getElectionStatus();
      electionStatus = { started, ended };
    } catch (bcErr) {
      console.warn("Could not fetch candidates from blockchain:", bcErr.message);
    }

    // Enrich with SQLite metadata only (description/image) — never IDs
    const [sqliteCandidates] = await pool.execute(
      "SELECT id, description, image_url FROM candidates"
    );
    const metaById = {};
    sqliteCandidates.forEach((c) => { metaById[c.id] = c; });

    const enriched = onChainCandidates.map((c) => ({
      ...c,
      description: metaById[c.id]?.description || "",
      image_url:   metaById[c.id]?.image_url || null,
    }));

    return res.status(200).json({
      success: true,
      candidates: enriched,
      electionStatus,
      total: enriched.length,
    });
  } catch (err) {
    console.error("getCandidates error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch candidates." });
  }
};

// ── POST /api/vote ───────────────────────────────────────────────────────────
const castVote = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { candidateId, txHash, walletAddress } = req.body;
    const userId = req.user.id;

    if (!candidateId || !txHash || !walletAddress) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: "candidateId, txHash, and walletAddress are required.",
      });
    }

    const [userRows] = await conn.execute(
      "SELECT has_voted FROM users WHERE id = ?",
      [userId]
    );
    if (!userRows.length) {
      conn.release();
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (userRows[0].has_voted) {
      conn.release();
      return res.status(409).json({
        success: false,
        message: "You have already voted. Double voting is not allowed.",
      });
    }

    // Verify the blockchain transaction
    try {
      const provider = getProvider();
      const receipt  = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status !== 1) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: "Blockchain transaction failed or not found.",
        });
      }

      if (
        receipt.to &&
        receipt.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
      ) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: "Transaction was not sent to the voting contract.",
        });
      }
    } catch (bcErr) {
      console.warn("Blockchain verification warning:", bcErr.message);
    }

    await conn.beginTransaction();

    await conn.execute(
      "INSERT INTO votes (user_id, candidate_id, tx_hash, wallet_address) VALUES (?, ?, ?, ?)",
      [userId, candidateId, txHash, walletAddress.toLowerCase()]
    );

    await conn.execute("UPDATE users SET has_voted = 1 WHERE id = ?", [userId]);

    await conn.execute(
      "UPDATE candidates SET votes = votes + 1 WHERE id = ?",
      [candidateId]
    );

    await conn.commit();
    conn.release();

    return res.status(200).json({
      success: true,
      message: "Your vote has been cast successfully and recorded on the blockchain!",
      txHash,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    console.error("castVote error:", err);
    return res.status(500).json({ success: false, message: "Could not cast vote. Please try again." });
  }
};

// ── GET /api/getResults ──────────────────────────────────────────────────────
const getResults = async (req, res) => {
  try {
    let blockchainCandidates = [];
    let totalVotes           = 0;
    let electionStatus       = { started: false, ended: false };
    let winner               = null;

    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const onChain = await contract.getAllCandidates();
      blockchainCandidates = onChain.map((c) => ({
        id:    Number(c.id),
        name:  c.name,
        party: c.party,
        votes: Number(c.voteCount),
      }));
      totalVotes = blockchainCandidates.reduce((sum, c) => sum + c.votes, 0);

      const [started, ended] = await contract.getElectionStatus();
      electionStatus = { started, ended };

      if (ended && totalVotes > 0) {
        const w = await contract.getWinner();
        winner = { id: Number(w.id), name: w.name, party: w.party, votes: Number(w.voteCount) };
      }
    } catch (bcErr) {
      console.warn("Blockchain results fetch warning:", bcErr.message);
    }

    const [sqliteCandidates] = await pool.execute(
      "SELECT id, description, image_url FROM candidates"
    );
    const metaById = {};
    sqliteCandidates.forEach((c) => { metaById[c.id] = c; });

    const results = blockchainCandidates
      .map((c) => {
        const percentage = totalVotes > 0
          ? parseFloat(((c.votes / totalVotes) * 100).toFixed(2))
          : 0;
        return {
          ...c,
          description: metaById[c.id]?.description || "",
          image_url:   metaById[c.id]?.image_url || null,
          percentage,
        };
      })
      .sort((a, b) => b.votes - a.votes);

    return res.status(200).json({
      success: true,
      results,
      totalVotes,
      electionStatus,
      winner,
    });
  } catch (err) {
    console.error("getResults error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch results." });
  }
};

// ── GET /api/transaction/:txHash ─────────────────────────────────────────────
const getTransaction = async (req, res) => {
  try {
    const { txHash } = req.params;
    const provider   = getProvider();

    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    const block = tx.blockNumber
      ? await provider.getBlock(tx.blockNumber)
      : null;

    return res.status(200).json({
      success: true,
      transaction: {
        hash:        tx.hash,
        from:        tx.from,
        to:          tx.to,
        blockNumber: tx.blockNumber,
        gasLimit:    tx.gasLimit?.toString(),
        gasPrice:    tx.gasPrice?.toString(),
        nonce:       tx.nonce,
        status:      receipt ? (receipt.status === 1 ? "Success" : "Failed") : "Pending",
        gasUsed:     receipt?.gasUsed?.toString(),
        timestamp:   block ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
        value:       ethers.formatEther(tx.value || 0n),
      },
    });
  } catch (err) {
    console.error("getTransaction error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch transaction." });
  }
};

module.exports = { getCandidates, castVote, getResults, getTransaction };