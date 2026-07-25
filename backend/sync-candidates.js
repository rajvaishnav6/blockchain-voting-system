require("dotenv").config();
const { ethers } = require("ethers");
const Database   = require("better-sqlite3");
const path       = require("path");
const fs         = require("fs");

const db = new Database(path.join(__dirname, "voting.db"));

async function syncFromBlockchain() {
  const contractPath = path.join(__dirname, "../frontend/src/contracts/VotingSystem.json");
  const data     = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
  const contract = new ethers.Contract(data.address, data.abi, provider);

  console.log("Contract Address:", data.address);

  const onChain = await contract.getAllCandidates();
  console.log("\n=== Blockchain Candidates (Asli Truth) ===");
  console.log("Total:", onChain.length);
  onChain.forEach((c) =>
    console.log(` ID ${c.id}: ${c.name} (${c.party}) - votes: ${c.voteCount}`)
  );

  if (onChain.length === 0) {
    console.log("\n⚠️  Blockchain pe koi candidate nahi hai! Pehle Admin se add karo.");
    db.close();
    return;
  }

  db.prepare("DELETE FROM votes").run();
  db.prepare("DELETE FROM candidates").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='candidates'").run();
  db.prepare("UPDATE users SET has_voted = 0").run();

  const insert = db.prepare(
    "INSERT INTO candidates (id, name, party, description, votes) VALUES (?, ?, ?, ?, ?)"
  );
  onChain.forEach((c) => {
    insert.run(Number(c.id), c.name, c.party, "", Number(c.voteCount));
  });

  console.log("\n✅ SQLite ab blockchain ke saath sync ho gaya!");
  const final = db.prepare("SELECT * FROM candidates ORDER BY id").all();
  final.forEach((c) => console.log(` DB ID ${c.id}: ${c.name}`));

  db.close();
}

syncFromBlockchain().catch((err) => {
  console.error("❌ Error:", err.message);
  db.close();
});