const express = require("express");
const router = express.Router();
const aiFinancialAdvisor = require("../services/aiFinancialAdvisor");

// POST /api/ai-analysis
// Analyze transactions and provide financial advice
router.post("/analyze", async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: "Invalid input: transactions must be an array",
      });
    }

    const analysis = await aiFinancialAdvisor.analyzeTransactions(transactions);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error in AI analysis route:", error);
    res.status(500).json({
      error: "Failed to analyze transactions",
      message: error.message,
    });
  }
});

module.exports = router;
