const express = require('express');
const router = express.Router();
const {
  getAIInsights,
  updateAIModel,
  categorizeTransaction,
  trainAIModel,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// GET /api/ai/insights
router.get('/insights', getAIInsights);

// POST /api/ai/update
router.post('/update', updateAIModel);

// POST /api/ai/categorize
router.post('/categorize', categorizeTransaction);

// POST /api/ai/train
router.post('/train', trainAIModel);

module.exports = router;
