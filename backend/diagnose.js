require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function diagnose() {
  console.log("========================================");
  console.log("Backend .env CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

  const contractPath = path.join(__dirname, "../frontend/src/contracts/VotingSystem.json");
  const data = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  console.log("VotingSystem.json address:   ", data.address);

  const match = (process.env.CONTRACT_ADDRESS || "").toLowerCase() === data.address.toLowerCase();
  console.log("Addresses match?             ", match ? "✅ YES" : "❌ NO — YEH PROBLEM HAI!");
  console.log("========================================\n");

  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
  const contract = new ethers.Contract(data.address, data.abi, provider);

  const candidateCount = await contract.candidateCount();
  console.log("Total candidates ever added (incl. removed):", candidateCount.toString());

  try {
    const allCandidates = await contract.getAllCandidates();
    console.log("Active candidates returned:", allCandidates.length);
    allCandidates.forEach((c) =>
      console.log(`  ID ${c.id}: ${c.name} (${c.party}) - votes: ${c.voteCount}`)
    );
  } catch (e) {
    console.log("❌ getAllCandidates() FAILED:", e.message);
  }

  const [started, ended] = await contract.getElectionStatus();
  console.log("\nElection started:", started);
  console.log("Election ended:  ", ended);
}

diagnose().catch((err) => console.error("❌ FATAL ERROR:", err.message));