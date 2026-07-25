const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "voting.db"));

// Candidates check karo
const candidates = db.prepare("SELECT * FROM candidates").all();
console.log("Current candidates:", candidates.length);

// Candidates add karo agar nahi hain
if (candidates.length === 0) {
  const insert = db.prepare(
    "INSERT INTO candidates (name, party, description, votes) VALUES (?, ?, ?, 0)"
  );
  insert.run("Rahul Sharma",  "Progressive Party", "Education aur technology ka champion");
  insert.run("Priya Singh",   "Green Party",       "Environment aur sustainability leader");
  insert.run("Amit Verma",    "National Party",    "Economy aur development focused");
  insert.run("Neha Gupta",    "Unity Party",       "Healthcare aur social welfare");
  insert.run("Rajesh Kumar",  "Reform Party",      "Anti-corruption aur transparency");
  console.log("✅ 5 candidates added!");
} else {
  console.log("✅ Candidates already exist:");
  candidates.forEach((c) => console.log(" -", c.id, c.name));
}

// Election status reset karo
db.prepare("DELETE FROM election_status").run();
db.prepare(
  "INSERT INTO election_status (id, status) VALUES (1, 'not_started')"
).run();
console.log("✅ Election status reset!");

// Verify
const status = db.prepare("SELECT * FROM election_status").get();
console.log("Election Status:", status.status);

// Verify candidates
const allCandidates = db.prepare("SELECT * FROM candidates").all();
console.log("Total Candidates:", allCandidates.length);
allCandidates.forEach((c) => console.log(" -", c.id, c.name, "|", c.party));

db.close();
console.log("✅ Done!");