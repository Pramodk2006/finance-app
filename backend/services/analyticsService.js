const Transaction = require("../models/transactionModel");
const Budget = require("../models/Budget");

// Get spending analytics for a specific period
const getSpendingAnalytics = async (userId, period = "month") => {
  // Calculate date range
  const now = new Date();
  let startDate;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  // Add debug logs to verify the query parameters and results
  console.log("Analytics query parameters:", {
    userId: userId,
    type: "expense",
    dateRange: { startDate, endDate: now },
  });

  // Get all expenses in the period
  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "expense",
      },
    },
    {
      $addFields: {
        // Convert string dates to Date objects if needed
        parsedDate: {
          $cond: {
            if: { $eq: [{ $type: "$date" }, "string"] },
            then: { $dateFromString: { dateString: "$date" } },
            else: "$date",
          },
        },
      },
    },
    {
      $match: {
        parsedDate: { $gte: startDate, $lte: now },
      },
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$category", "savings"] },
            then: "Savings",
            else: { $ifNull: ["$category", "Uncategorized"] },
          },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        transactions: { $push: "$$ROOT" },
      },
    },
    {
      $match: {
        _id: { $ne: "Savings" }, // Exclude savings from expense categories
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  console.log("Fetched expenses:", expenses);

  // Get previous period for comparison
  const previousStartDate = new Date(startDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - 1);

  const previousExpenses = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "expense",
      },
    },
    {
      $addFields: {
        parsedDate: {
          $cond: {
            if: { $eq: [{ $type: "$date" }, "string"] },
            then: { $dateFromString: { dateString: "$date" } },
            else: "$date",
          },
        },
      },
    },
    {
      $match: {
        parsedDate: { $gte: previousStartDate, $lt: startDate },
      },
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$category", "savings"] },
            then: "Savings",
            else: { $ifNull: ["$category", "Uncategorized"] },
          },
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $match: {
        _id: { $ne: "Savings" }, // Exclude savings from expense categories
      },
    },
  ]);

  // Calculate spending trends
  const trends = expenses.map((current) => {
    const previous = previousExpenses.find((p) => p._id === current._id);
    const previousTotal = previous ? previous.total : 0;
    const change = previousTotal
      ? ((current.total - previousTotal) / previousTotal) * 100
      : 0;

    return {
      category: current._id || "Uncategorized",
      currentTotal: current.total,
      previousTotal,
      change,
      transactionCount: current.count,
      transactions: current.transactions,
    };
  });

  // Get total spending (excluding savings)
  const totalSpending = expenses.reduce(
    (sum, category) => sum + category.total,
    0
  );
  const previousTotalSpending = previousExpenses.reduce(
    (sum, category) => sum + category.total,
    0
  );
  const totalChange = previousTotalSpending
    ? ((totalSpending - previousTotalSpending) / previousTotalSpending) * 100
    : 0;

  // Sort transactions by date for time series
  const timeSeriesData = expenses
    .flatMap((category) =>
      category.transactions.map((transaction) => ({
        date: transaction.parsedDate || transaction.date,
        amount: transaction.amount,
        category: transaction.category || "Uncategorized",
      }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    period,
    startDate,
    endDate: now,
    totalSpending,
    previousTotalSpending,
    totalChange,
    categories: trends,
    topCategories: trends.slice(0, 5),
    monthlyAverage: totalSpending / (period === "year" ? 12 : 1),
    timeSeriesData,
  };
};

// Get spending patterns and insights
const getSpendingInsights = async (userId) => {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  // Get recent transactions
  const transactions = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "expense",
      },
    },
    {
      $addFields: {
        parsedDate: {
          $cond: {
            if: { $eq: [{ $type: "$date" }, "string"] },
            then: { $dateFromString: { dateString: "$date" } },
            else: "$date",
          },
        },
      },
    },
    {
      $match: {
        parsedDate: { $gte: threeMonthsAgo },
        category: { $ne: "savings" }, // Exclude savings from insights
      },
    },
    {
      $sort: { parsedDate: -1 },
    },
  ]);

  // Analyze spending patterns
  const patterns = {
    frequentCategories: {},
    largeTransactions: [],
    recurringExpenses: [],
  };

  transactions.forEach((transaction) => {
    const category = transaction.category || "Uncategorized";

    // Track frequent categories
    patterns.frequentCategories[category] =
      (patterns.frequentCategories[category] || 0) + 1;

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
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  return {
    topCategories,
    largeTransactions: patterns.largeTransactions.slice(0, 5),
    recurringExpenses: patterns.recurringExpenses,
    totalTransactions: transactions.length,
    averageTransactionAmount:
      transactions.reduce((sum, t) => sum + t.amount, 0) /
        transactions.length || 0,
    mostActiveCategory: topCategories[0]?.category || "None",
  };
};

module.exports = {
  getSpendingAnalytics,
  getSpendingInsights,
};
