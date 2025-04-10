const express = require('express');
const router = express.Router();
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  updateBudgetSpent,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// GET /api/budgets
router.get('/', getBudgets);

// POST /api/budgets
router.post('/', createBudget);

// PUT /api/budgets/:id
router.put('/:id', updateBudget);

// DELETE /api/budgets/:id
router.delete('/:id', deleteBudget);

// PUT /api/budgets/:id/spent
router.put('/:id/spent', updateBudgetSpent);

module.exports = router; 