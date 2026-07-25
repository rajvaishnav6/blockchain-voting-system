require("dotenv").config();

const express = require("express");
const helmet  = require("helmet");
const morgan  = require("morgan");

const { testConnection } = require("./config/database");
const authRoutes  = require("./routes/authRoutes");
const voteRoutes  = require("./routes/voteRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — Manually set karo (no cors package) ────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight request handle karo
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// ── Security + Logging ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🗳️ Blockchain Voting System API",
    version: "1.0.0",
    port:    PORT,
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);
app.use("/api", voteRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await testConnection();

  const server = app.listen(PORT, () => {
    console.log(`\n🗳️  API running on http://localhost:${PORT}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is busy!`);
      console.error(`   Run: taskkill /F /IM node.exe`);
      process.exit(1);
    }
  });

  process.on("SIGTERM", () => server.close());
  process.on("SIGINT",  () => server.close());
}

start();