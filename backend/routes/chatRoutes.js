const express = require("express");
const router = express.Router();
const { processChatMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes
router.use(protect);

// Chat routes
router.post("/", processChatMessage);

module.exports = router;
