const { pool, testConnection } = require("./config/database");

async function test() {
  await testConnection();

  // Test candidates
  const [candidates] = await pool.execute("SELECT * FROM candidates");
  console.log("✅ Candidates:", candidates.length);
  candidates.forEach(c => console.log(" -", c.name, "|", c.party));

  // Test admins
  const [admins] = await pool.execute("SELECT id, name, email FROM admins");
  console.log("✅ Admins:", admins);
}

test().catch(console.error);