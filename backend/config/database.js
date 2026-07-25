const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

// Database file backend folder mein banega
const db = new Database(path.join(__dirname, "../voting.db"), {
  verbose: console.log,
});

// WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Create Tables ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    has_voted INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'voter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    party TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    votes INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
  );

  CREATE TABLE IF NOT EXISTS election_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL DEFAULT 'not_started',
    tx_hash TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed Data ─────────────────────────────────────────────────────────────────

// Election status
const statusCount = db.prepare("SELECT COUNT(*) as c FROM election_status").get();
if (statusCount.c === 0) {
  db.prepare("INSERT INTO election_status (status) VALUES ('not_started')").run();
}

// Admin account
const adminCount = db.prepare("SELECT COUNT(*) as c FROM admins").get();
if (adminCount.c === 0) {
  const hash = bcrypt.hashSync("admin123", 12);
  db.prepare(
    "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)"
  ).run("System Admin", "admin@voting.com", hash);
  console.log("✅ Admin account created: admin@voting.com / admin123");
}

// Sample candidates
const candCount = db.prepare("SELECT COUNT(*) as c FROM candidates").get();
if (candCount.c === 0) {
  const insert = db.prepare(
    "INSERT INTO candidates (name, party, description) VALUES (?, ?, ?)"
  );
  const candidates = [
    ["Rahul Sharma",  "Progressive Party", "Education aur technology ka champion"],
    ["Priya Singh",   "Green Party",       "Environment aur sustainability leader"],
    ["Amit Verma",    "National Party",    "Economy aur development focused"],
    ["Neha Gupta",    "Unity Party",       "Healthcare aur social welfare"],
    ["Rajesh Kumar",  "Reform Party",      "Anti-corruption aur transparency"],
  ];
  candidates.forEach((c) => insert.run(...c));
  console.log("✅ Sample candidates inserted!");
}

// ── Pool Wrapper (mysql2 compatible API) ──────────────────────────────────────
const pool = {
  execute: async (sql, params = []) => {
    const s   = sql.trim().toUpperCase();
    const isSelect = s.startsWith("SELECT") || s.startsWith("SHOW") || s.startsWith("DESCRIBE");
    const stmt = db.prepare(sql);
    if (isSelect) {
      const rows = stmt.all(...params);
      return [rows];
    } else {
      const info = stmt.run(...params);
      return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
    }
  },

  getConnection: async () => {
    let inTransaction = false;
    return {
      execute: async (sql, params = []) => pool.execute(sql, params),
      beginTransaction: async () => {
        db.prepare("BEGIN").run();
        inTransaction = true;
      },
      commit: async () => {
        if (inTransaction) {
          db.prepare("COMMIT").run();
          inTransaction = false;
        }
      },
      rollback: async () => {
        if (inTransaction) {
          db.prepare("ROLLBACK").run();
          inTransaction = false;
        }
      },
      release: () => {},
    };
  },
};

async function testConnection() {
  console.log("✅ SQLite connected: voting.db");
}

module.exports = { pool, testConnection };