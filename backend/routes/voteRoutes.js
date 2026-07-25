const express        = require("express");
const router         = express.Router();
const { getCandidates, castVote, getResults, getTransaction } =
  require("../controllers/voteController");
const authMiddleware = require("../middleware/authMiddleware");

router.get( "/getCandidates",          getCandidates);
router.get( "/getResults",             getResults);
router.get( "/transaction/:txHash",    getTransaction);
router.post("/vote", authMiddleware,   castVote);

module.exports = router;