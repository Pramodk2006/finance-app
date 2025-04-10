const express = require("express");
const router = express.Router();
const { getAIBudgetPredictions } = require("../controllers/aiBudgetController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes
router.use(protect);

// @route   POST /api/aibudget/predictions
// @desc    Get AI budget predictions
// @access  Private
router.post("/predictions", async (req, res) => {
  try {
    const result = await getAIBudgetPredictions(req, res);
    return result;
  } catch (error) {
    console.error("AI Budget Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process budget predictions",
    });
  }
});

module.exports = router;
