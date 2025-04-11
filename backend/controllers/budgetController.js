const Budget = require("../models/Budget");
const asyncHandler = require("express-async-handler");

// @desc    Get all budgets for the authenticated user
// @route   GET /api/budgets
// @access  Private
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id });
  res.json(budgets);
});

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = asyncHandler(async (req, res) => {
  const { name, amount, category, period, startDate, endDate } = req.body;

  if (!name || !amount || !category || !period) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: name, amount, category, and period"
    );
  }

  const budget = await Budget.create({
    user: req.user._id,
    name,
    amount,
    category,
    period,
    startDate: startDate || new Date(),
    endDate,
  });

  res.status(201).json(budget);
});

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = asyncHandler(async (req, res) => {
  const { name, amount, category, period, startDate, endDate, isActive } =
    req.body;

  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  if (budget.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  budget.name = name || budget.name;
  budget.amount = amount || budget.amount;
  budget.category = category || budget.category;
  budget.period = period || budget.period;
  budget.startDate = startDate || budget.startDate;
  budget.endDate = endDate || budget.endDate;
  budget.isActive = isActive !== undefined ? isActive : budget.isActive;

  const updatedBudget = await budget.save();
  res.json(updatedBudget);
});

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  if (budget.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  await Budget.findByIdAndDelete(req.params.id);
  res.json({ message: "Budget removed" });
});

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
