const asyncHandler = require('express-async-handler');
const Transaction = require('../models/transactionModel');
const Budget = require('../models/Budget');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const { description, amount, type, category, date, isRecurring, recurringFrequency } = req.body;

  // Create the transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    description,
    amount,
    type,
    category,
    date: date || Date.now(),
    originalDescription: description, // Store original for AI training
    isRecurring: isRecurring || false,
    recurringFrequency: recurringFrequency || null,
  });

  // If it's an expense, update the corresponding budget
  if (type === 'expense' && category) {
    // Find the active budget for this category
    const budget = await Budget.findOne({
      user: req.user._id,
      category: category,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    });

    if (budget) {
      // Ensure both values are numbers before adding
      const currentSpent = parseFloat(budget.spent || 0);
      const transactionAmount = parseFloat(amount);
      
      // Update the spent amount
      budget.spent = currentSpent + transactionAmount;
      await budget.save();
    }
  }

  if (transaction) {
    res.status(201).json(transaction);
  } else {
    res.status(400);
    throw new Error('Invalid transaction data');
  }
});

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
  res.json(transactions);
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    transaction.description = req.body.description || transaction.description;
    transaction.amount = req.body.amount || transaction.amount;
    transaction.type = req.body.type || transaction.type;
    transaction.category = req.body.category || transaction.category;
    transaction.date = req.body.date || transaction.date;
    transaction.isRecurring = req.body.isRecurring !== undefined ? req.body.isRecurring : transaction.isRecurring;
    transaction.recurringFrequency = req.body.recurringFrequency || transaction.recurringFrequency;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } else {
    res.status(404);
    throw new Error('Transaction not found');
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
  if (period === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    dateFilter = { date: { $gte: weekStart } };
  } else if (period === 'month') {
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    dateFilter = { date: { $gte: monthStart } };
  } else if (period === 'year') {
    const yearStart = new Date(now);
    yearStart.setFullYear(now.getFullYear() - 1);
    dateFilter = { date: { $gte: yearStart } };
  }

  // Get income and expense totals
  const incomeTotal = await Transaction.aggregate([
    { $match: { user: req.user._id, type: 'income', ...dateFilter } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const expenseTotal = await Transaction.aggregate([
    { $match: { user: req.user._id, type: 'expense', ...dateFilter } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Get category breakdown
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { user: req.user._id, ...dateFilter } },
    { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' } } },
    { $sort: { total: -1 } }
  ]);

  res.json({
    income: incomeTotal.length > 0 ? incomeTotal[0].total : 0,
    expense: expenseTotal.length > 0 ? expenseTotal[0].total : 0,
    categories: categoryBreakdown.map(item => ({
      category: item._id.category,
      type: item._id.type,
      total: item.total
    }))
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
