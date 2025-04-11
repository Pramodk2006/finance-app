const Transaction = require('../models/transactionModel');
const Budget = require('../models/Budget');

// Get spending analytics for a specific period
const getSpendingAnalytics = async (userId, period = 'month') => {
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  // Add debug logs to verify the query parameters and results
  console.log("Querying transactions with:", {
    user: userId,
    type: 'expense',
    date: { $gte: startDate, $lte: now },
  });

  // Get all expenses in the period
  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId: userId, // Corrected field name
        type: 'expense',
        date: { $gte: startDate, $lte: now }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        transactions: { $push: '$$ROOT' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  console.log("Fetched expenses:", expenses);

  // Debug log to check the expenses
  console.log('Expenses by category:', expenses);

  // Get previous period for comparison
  const previousStartDate = new Date(startDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - 1);
  
  const previousExpenses = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        // Remove date filtering for testing purposes
        // date: { $gte: previousStartDate, $lt: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Debug log to check the previous expenses
  console.log('Previous expenses by category:', previousExpenses);

  // Calculate spending trends
  const trends = expenses.map(current => {
    const previous = previousExpenses.find(p => p._id === current._id);
    const previousTotal = previous ? previous.total : 0;
    const change = previousTotal ? ((current.total - previousTotal) / previousTotal) * 100 : 0;
    
    return {
      category: current._id,
      currentTotal: current.total,
      previousTotal,
      change,
      transactionCount: current.count,
      transactions: current.transactions
    };
  });

  // Get total spending
  const totalSpending = expenses.reduce((sum, category) => sum + category.total, 0);
  const previousTotalSpending = previousExpenses.reduce((sum, category) => sum + category.total, 0);
  const totalChange = previousTotalSpending ? ((totalSpending - previousTotalSpending) / previousTotalSpending) * 100 : 0;

  const timeSeriesData = expenses.flatMap(category => 
    category.transactions.map(transaction => ({
      date: transaction.date,
      amount: transaction.amount,
    }))
  );

  // Add debug logs to verify the data being processed and returned
  console.log("Expenses fetched for analytics:", expenses);
  console.log("Previous period expenses:", previousExpenses);
  console.log("Trends calculated:", trends);
  console.log("Total spending:", totalSpending, "Previous total spending:", previousTotalSpending, "Total change:", totalChange);

  return {
    period,
    startDate,
    endDate: now,
    totalSpending,
    previousTotalSpending,
    totalChange,
    categories: trends,
    topCategories: trends.slice(0, 5),
    monthlyAverage: totalSpending / (period === 'year' ? 12 : 1),
    timeSeriesData
  };
};

// Get spending patterns and insights
const getSpendingInsights = async (userId) => {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  // Get recent transactions
  const transactions = await Transaction.find({
    user: userId,
    type: 'expense',
    // Remove date filtering for testing purposes
    // date: { $gte: threeMonthsAgo }
  }).sort({ date: -1 });

  // Analyze spending patterns
  const patterns = {
    frequentCategories: {},
    largeTransactions: [],
    recurringExpenses: []
  };

  transactions.forEach(transaction => {
    // Track frequent categories
    patterns.frequentCategories[transaction.category] = 
      (patterns.frequentCategories[transaction.category] || 0) + 1;

    // Track large transactions (more than $500)
    if (transaction.amount > 500) {
      patterns.largeTransactions.push(transaction);
    }

    // Track recurring expenses
    if (transaction.isRecurring) {
      patterns.recurringExpenses.push(transaction);
    }
  });

  // Sort and get top categories
  const topCategories = Object.entries(patterns.frequentCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  return {
    topCategories,
    largeTransactions: patterns.largeTransactions.slice(0, 5),
    recurringExpenses: patterns.recurringExpenses,
    totalTransactions: transactions.length,
    averageTransactionAmount: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
  };
};

module.exports = {
  getSpendingAnalytics,
  getSpendingInsights
};