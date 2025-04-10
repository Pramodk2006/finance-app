const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { detectSpendingPatterns } = require('../services/spendingPatternDetector');
const { generateBudgetRecommendations } = require('../services/budgetRecommender');

// @desc    Get spending patterns
// @route   GET /api/analytics/spending-patterns
// @access  Private
router.get('/spending-patterns', protect, async (req, res) => {
  try {
    const { period } = req.query || 'month';
    const patterns = await detectSpendingPatterns(req.user._id, period);
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching spending patterns:', error);
    res.status(500).json({ message: 'Failed to fetch spending patterns' });
  }
});

// @desc    Get budget recommendations
// @route   GET /api/analytics/budget-recommendations
// @access  Private
router.get('/budget-recommendations', protect, async (req, res) => {
  try {
    const { period } = req.query || 'month';
    const recommendations = await generateBudgetRecommendations(req.user._id, period);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    res.status(500).json({ message: 'Failed to generate budget recommendations' });
  }
});

module.exports = router;
