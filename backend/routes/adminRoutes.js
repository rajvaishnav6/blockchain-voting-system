/**
 * routes/adminRoutes.js
 * Admin-only management endpoints.
 */

const express         = require("express");
const router          = express.Router();
const {
  addCandidate,
  startElection,
  endElection,
  resetElection,
  getStats,
  getVoters,
  removeCandidate,
} = require("../controllers/adminController");
const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const protect = [authMiddleware, adminMiddleware];

router.post("/addCandidate",   ...protect, addCandidate);
router.post("/startElection",  ...protect, startElection);
router.post("/endElection",    ...protect, endElection);
router.post("/resetElection",  ...protect, resetElection);
router.get( "/stats",          ...protect, getStats);
router.get( "/voters",         ...protect, getVoters);
router.delete("/candidate/:id",...protect, removeCandidate);

module.exports = router;