const express = require("express");
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all budgets & Create new budget
router.route("/").get(getBudgets).post(createBudget);

// Update & Delete budget
router.route("/:id").put(updateBudget).delete(deleteBudget);

module.exports = router;
