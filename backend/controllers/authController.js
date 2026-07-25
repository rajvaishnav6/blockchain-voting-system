const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { pool } = require("../config/database");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

// POST /api/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, has_voted, role) VALUES (?, ?, ?, 0, 'voter')",
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const token = signToken({
      id:    result.insertId,
      email: email.toLowerCase(),
      role:  "voter",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      token,
      user: {
        id:       result.insertId,
        name:     name.trim(),
        email:    email.toLowerCase(),
        hasVoted: false,
        role:     "voter",
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// POST /api/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Check users table
    let user = null;
    let role = "voter";

    const [users] = await pool.execute(
      "SELECT id, name, email, password, has_voted FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (users.length > 0) {
      user = users[0];
    } else {
      // Check admins table
      const [admins] = await pool.execute(
        "SELECT id, name, email, password FROM admins WHERE email = ?",
        [email.toLowerCase()]
      );
      if (admins.length > 0) {
        user = admins[0];
        role = "admin";
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken({ id: user.id, email: user.email, role });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        hasVoted: role === "voter" ? Boolean(user.has_voted) : undefined,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;

    if (role === "admin") {
      const [rows] = await pool.execute(
        "SELECT id, name, email FROM admins WHERE id = ?",
        [id]
      );
      user = rows[0];
    } else {
      const [rows] = await pool.execute(
        "SELECT id, name, email, has_voted AS hasVoted, created_at FROM users WHERE id = ?",
        [id]
      );
      user = rows[0];
      if (user) user.hasVoted = Boolean(user.hasVoted);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let voteRecord = null;
    if (role === "voter" && user.hasVoted) {
      const [votes] = await pool.execute(
        `SELECT v.id, v.candidate_id AS candidateId, v.tx_hash AS txHash,
                v.created_at AS timestamp, c.name AS candidateName, c.party
         FROM votes v
         JOIN candidates c ON v.candidate_id = c.id
         WHERE v.user_id = ?`,
        [id]
      );
      voteRecord = votes[0] || null;
    }

    return res.status(200).json({
      success: true,
      user: { ...user, role },
      voteRecord,
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = { register, login, getProfile };