const asyncHandler = require("express-async-handler");
const Transaction = require("../models/transactionModel");
const Budget = require("../models/Budget");

// New function to handle budget updates
const updateBudgetOnTransaction = async (userId, category, amount) => {
  try {
    // Find the active budget for this category
    const budget = await Budget.findOne({
      user: userId,
      category: category.toLowerCase(),
      isActive: true,
    });

    if (!budget) {
      console.log(`No active budget found for category: ${category}`);
      return null;
    }

    // Calculate new spent amount
    const newSpent = budget.spent + parseFloat(amount);

    // Update the budget
    const updatedBudget = await Budget.findByIdAndUpdate(
      budget._id,
      { $set: { spent: newSpent } },
      { new: true } // Return the updated document
    );

    console.log("Budget updated:", {
      category: updatedBudget.category,
      previousSpent: budget.spent,
      newSpent: updatedBudget.spent,
      totalBudget: updatedBudget.amount,
    });

    return updatedBudget;
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  try {
    const {
      description,
      amount,
      type,
      category,
      date,
      isRecurring,
      recurringFrequency,
    } = req.body;

    console.log("Received transaction request:", {
      description,
      amount,
      type,
      category,
      date,
    });

    if (!req.user || !req.user._id) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    // Create the transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      description,
      amount: parseFloat(amount),
      type,
      category: category ? category.trim().toLowerCase() : category, // Normalize category
      date: date || Date.now(),
      originalDescription: description,
      aiCategorized: false,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
    });

    console.log("Transaction created successfully:", {
      id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
    });

    let updatedBudget = null;

    // If it's an expense, update the corresponding budget
    if (type === "expense" && category) {
      console.log("Processing expense transaction for budget update");

      try {
        updatedBudget = await updateBudgetOnTransaction(
          req.user._id,
          category,
          amount
        );
      } catch (budgetError) {
        console.error("Budget update failed:", budgetError);
        // We'll still return the transaction even if budget update fails
      }
    }

    res.status(201).json({
      transaction,
      budgetUpdated: !!updatedBudget,
      updatedBudget,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error in createTransaction:", error);
    res.status(500).json({
      message: "Failed to create transaction",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({
    date: -1,
  });
  res.json(transactions);
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (
    transaction &&
    transaction.userId.toString() === req.user._id.toString()
  ) {
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (
    transaction &&
    transaction.userId.toString() === req.user._id.toString()
  ) {
    transaction.description = req.body.description || transaction.description;
    transaction.amount = req.body.amount || transaction.amount;
    transaction.type = req.body.type || transaction.type;
    transaction.category = req.body.category || transaction.category;
    transaction.date = req.body.date || transaction.date;
    transaction.isRecurring =
      req.body.isRecurring !== undefined
        ? req.body.isRecurring
        : transaction.isRecurring;
    transaction.recurringFrequency =
      req.body.recurringFrequency || transaction.recurringFrequency;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (
    transaction &&
    transaction.userId.toString() === req.user._id.toString()
  ) {
    await transaction.remove();
    res.json({ message: "Transaction removed" });
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = asyncHandler(async (req, res) => {
  const { period } = req.query;
  let dateFilter = {};

  // Calculate date range based on period
  const now = new Date();
  if (period === "week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    dateFilter = { date: { $gte: weekStart } };
  } else if (period === "month") {
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    dateFilter = { date: { $gte: monthStart } };
  } else if (period === "year") {
    const yearStart = new Date(now);
    yearStart.setFullYear(now.getFullYear() - 1);
    dateFilter = { date: { $gte: yearStart } };
  }

  // Get income and expense totals
  const incomeTotal = await Transaction.aggregate([
    { $match: { userId: req.user._id, type: "income", ...dateFilter } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const expenseTotal = await Transaction.aggregate([
    { $match: { userId: req.user._id, type: "expense", ...dateFilter } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  // Get category breakdown
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { userId: req.user._id, ...dateFilter } },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res.json({
    income: incomeTotal.length > 0 ? incomeTotal[0].total : 0,
    expense: expenseTotal.length > 0 ? expenseTotal[0].total : 0,
    categories: categoryBreakdown.map((item) => ({
      category: item._id.category,
      type: item._id.type,
      total: item.total,
    })),
  });
});

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
};
