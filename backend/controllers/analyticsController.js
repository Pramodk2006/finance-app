const asyncHandler = require('express-async-handler');
const { getSpendingAnalytics, getSpendingInsights } = require('../services/analyticsService');

// @desc    Get spending analytics
// @route   GET /api/analytics/spending
// @access  Private
const getSpendingAnalyticsController = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const analytics = await getSpendingAnalytics(req.user._id, period);
  res.json(analytics);
});

// @desc    Get spending insights
// @route   GET /api/analytics/insights
// @access  Private
const getSpendingInsightsController = asyncHandler(async (req, res) => {
  const insights = await getSpendingInsights(req.user._id);
  res.json(insights);
});

module.exports = {
  getSpendingAnalyticsController,
  getSpendingInsightsController
}; 