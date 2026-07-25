const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "voting.db"));

db.prepare("DELETE FROM votes").run();
db.prepare("DELETE FROM candidates").run();
db.prepare("DELETE FROM sqlite_sequence WHERE name='candidates'").run();
db.prepare("UPDATE users SET has_voted = 0").run();
db.prepare("DELETE FROM election_status").run();
db.prepare("INSERT INTO election_status (id, status) VALUES (1, 'not_started')").run();

console.log("✅ Fresh start ready — sab candidates gone, election reset!");
db.close();