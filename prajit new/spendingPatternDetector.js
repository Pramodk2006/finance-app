const mongoose = require("mongoose");
const Transaction = require("../models/transactionModel");

// Detect spending patterns and trends
const detectSpendingPatterns = async (userId, period = "month") => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;

    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "quarter") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === "year") {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      throw new Error("Invalid period specified");
    }

    // Get transactions for the specified period
    const transactions = await Transaction.find({
      user: mongoose.Types.ObjectId(userId),
      date: { $gte: startDate },
    }).sort({ date: 1 });

    if (transactions.length === 0) {
      return {
        message: "Not enough transaction data to detect patterns",
        patterns: [],
        insights: [],
      };
    }

    // Group transactions by category
    const categoryGroups = {};
    transactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        if (!categoryGroups[transaction.category]) {
          categoryGroups[transaction.category] = [];
        }
        categoryGroups[transaction.category].push(transaction);
      }
    });

    // Calculate spending patterns
    const patterns = [];
    const insights = [];

    // 1. Top spending categories
    const categoryTotals = Object.entries(categoryGroups)
      .map(([category, txns]) => {
        const total = txns.reduce((sum, tx) => sum + tx.amount, 0);
        return { category, total };
      })
      .sort((a, b) => b.total - a.total);

    if (categoryTotals.length > 0) {
      patterns.push({
        type: "topCategories",
        data: categoryTotals.slice(0, 3),
      });

      insights.push({
        type: "topSpending",
        message: `Your top spending category is ${
          categoryTotals[0].category
        } with $${categoryTotals[0].total.toFixed(2)}.`,
      });

      // Add frequency-based insights
      categoryTotals.forEach(({ category, total }) => {
        const txns = categoryGroups[category];
        if (txns.length > 5) {
          insights.push({
            type: "frequency",
            message: `You have ${txns.length} transactions in ${category} category.`,
            suggestion: `Consider budgeting for ${category} expenses.`,
          });
        }
        if (total > 1000) {
          insights.push({
            type: "high-value",
            message: `${category} is a major expense category with total spending of $${total.toFixed(
              2
            )}.`,
            suggestion: `Look for ways to optimize ${category.toLowerCase()} expenses.`,
          });
        }
      });
    }

    // 2. Recurring transactions
    const recurringTransactions = [];
    Object.entries(categoryGroups).forEach(([category, txns]) => {
      // Group by similar amounts and descriptions
      const amountGroups = {};
      txns.forEach((tx) => {
        const roundedAmount = Math.round(tx.amount * 100) / 100; // More precise rounding
        if (!amountGroups[roundedAmount]) {
          amountGroups[roundedAmount] = [];
        }
        amountGroups[roundedAmount].push(tx);
      });

      // Check for recurring patterns
      Object.entries(amountGroups).forEach(([amount, amountTxns]) => {
        if (amountTxns.length >= 2) {
          // Check if descriptions are similar
          const descriptions = amountTxns.map((tx) =>
            tx.description.toLowerCase()
          );
          const uniqueDescriptions = [...new Set(descriptions)];

          if (uniqueDescriptions.length <= 3 && amountTxns.length >= 2) {
            recurringTransactions.push({
              category,
              amount: parseFloat(amount),
              frequency: amountTxns.length,
              transactions: amountTxns,
              lastDate: new Date(
                Math.max(...amountTxns.map((t) => new Date(t.date)))
              ),
            });
          }
        }
      });
    });

    if (recurringTransactions.length > 0) {
      patterns.push({
        type: "recurring",
        data: recurringTransactions,
      });

      const topRecurring = recurringTransactions.sort(
        (a, b) => b.amount - a.amount
      )[0];
      insights.push({
        type: "recurring",
        message: `You have a recurring ${
          topRecurring.category
        } expense of $${topRecurring.amount.toFixed(2)} that appears ${
          topRecurring.frequency
        } times.`,
        suggestion:
          "Review these recurring expenses for potential savings opportunities.",
      });
    }

    // 3. Spending trends over time
    const timeGroups = {};
    const monthlyGroups = {}; // Added monthly tracking
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        let timeKey;
        let monthKey;
        const txDate = new Date(tx.date);

        // Daily grouping
        if (period === "week" || period === "month") {
          timeKey = txDate.toISOString().split("T")[0];
        } else {
          // Weekly grouping
          const weekStart = new Date(txDate);
          weekStart.setDate(txDate.getDate() - txDate.getDay());
          timeKey = weekStart.toISOString().split("T")[0];
        }

        // Monthly grouping
        monthKey = `${txDate.getFullYear()}-${(txDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;

        if (!timeGroups[timeKey]) timeGroups[timeKey] = 0;
        if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = 0;

        timeGroups[timeKey] += tx.amount;
        monthlyGroups[monthKey] += tx.amount;
      }
    });

    const timeSeriesData = Object.entries(timeGroups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const monthlySeriesData = Object.entries(monthlyGroups)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    if (timeSeriesData.length > 0) {
      patterns.push({
        type: "timeSeries",
        data: timeSeriesData,
        monthlyData: monthlySeriesData,
      });

      // Detect increasing or decreasing trend
      if (timeSeriesData.length >= 3) {
        const firstHalf = timeSeriesData.slice(
          0,
          Math.floor(timeSeriesData.length / 2)
        );
        const secondHalf = timeSeriesData.slice(
          Math.floor(timeSeriesData.length / 2)
        );

        const firstHalfAvg =
          firstHalf.reduce((sum, item) => sum + item.amount, 0) /
          firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, item) => sum + item.amount, 0) /
          secondHalf.length;

        const percentChange =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (Math.abs(percentChange) >= 10) {
          insights.push({
            type: "trend",
            message:
              percentChange > 0
                ? `Your spending has increased by ${percentChange.toFixed(
                    1
                  )}% compared to the previous period.`
                : `Your spending has decreased by ${Math.abs(
                    percentChange
                  ).toFixed(1)}% compared to the previous period.`,
            suggestion:
              percentChange > 0
                ? "Consider reviewing your recent spending increases and identify areas for potential savings."
                : "Great job on reducing your spending! Keep maintaining these good financial habits.",
          });
        }
      }
    }

    // 4. Unusual spending
    const categoryAverages = {};
    Object.entries(categoryGroups).forEach(([category, txns]) => {
      if (txns.length >= 2) {
        const total = txns.reduce((sum, tx) => sum + tx.amount, 0);
        const average = total / txns.length;
        categoryAverages[category] = average;

        // Find outliers (transactions that are significantly higher than average)
        const outliers = txns.filter((tx) => tx.amount > average * 1.5);
        if (outliers.length > 0) {
          patterns.push({
            type: "unusual",
            category,
            average,
            outliers,
          });

          const topOutlier = outliers.sort((a, b) => b.amount - a.amount)[0];
          insights.push({
            type: "unusual",
            message: `Unusual spending: $${topOutlier.amount.toFixed(
              2
            )} on ${category} on ${new Date(
              topOutlier.date
            ).toLocaleDateString()} is ${(
              (topOutlier.amount / average) * 100 -
              100
            ).toFixed(0)}% higher than your average.`,
            suggestion:
              "Review this transaction to ensure it was necessary and look for ways to prevent similar high expenses in the future.",
          });
        }
      }
    });

    return {
      patterns,
      insights,
      summary: {
        totalTransactions: transactions.length,
        totalSpending: transactions
          .filter((tx) => tx.type === "expense")
          .reduce((sum, tx) => sum + tx.amount, 0),
        totalIncome: transactions
          .filter((tx) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0),
        categories: categoryTotals,
        monthlyTrends: monthlySeriesData,
      },
    };
  } catch (error) {
    console.error("Error detecting spending patterns:", error);
    throw error;
  }
};

// Enhanced version of analyzeSpendingPatterns that works with direct transaction data
const analyzeSpendingPatterns = async (transactions) => {
  try {
    const patterns = {
      recurring: [],
      categories: {},
      trends: {
        daily: {},
        monthly: {},
      },
      insights: [],
    };

    // Group transactions by category
    transactions.forEach((transaction) => {
      const amount =
        typeof transaction.amount === "string"
          ? parseFloat(transaction.amount.replace(/[^0-9.-]+/g, ""))
          : parseFloat(transaction.amount);

      if (transaction.type === "expense") {
        const category = transaction.category || "Uncategorized";
        if (!patterns.categories[category]) {
          patterns.categories[category] = {
            total: 0,
            count: 0,
            transactions: [],
          };
        }
        patterns.categories[category].total += amount;
        patterns.categories[category].count += 1;
        patterns.categories[category].transactions.push({
          amount,
          date: transaction.date,
          description: transaction.description,
        });
      }
    });

    // Analyze recurring transactions and generate insights
    Object.entries(patterns.categories).forEach(([category, data]) => {
      const { transactions } = data;
      if (transactions.length >= 2) {
        // Analyze patterns
        const amountGroups = transactions.reduce((groups, t) => {
          const roundedAmount = Math.round(t.amount * 100) / 100;
          if (!groups[roundedAmount]) groups[roundedAmount] = [];
          groups[roundedAmount].push(t);
          return groups;
        }, {});

        // Find recurring transactions
        Object.entries(amountGroups).forEach(([amount, txns]) => {
          if (txns.length >= 2) {
            patterns.recurring.push({
              category,
              amount: parseFloat(amount),
              frequency: txns.length,
              lastDate: new Date(
                Math.max(...txns.map((t) => new Date(t.date)))
              ),
            });
          }
        });

        // Generate category-specific insights
        const avgTransaction = data.total / data.count;

        if (data.count > 5) {
          patterns.insights.push({
            type: "frequency",
            category,
            message: `High transaction frequency in ${category}: ${data.count} transactions.`,
            suggestion: `Consider setting a monthly budget for ${category} expenses.`,
          });
        }

        if (data.total > 1000) {
          patterns.insights.push({
            type: "high-value",
            category,
            message: `High spending in ${category}: $${data.total.toFixed(2)}`,
            suggestion: `Review ${category.toLowerCase()} expenses for potential savings.`,
          });
        }

        if (avgTransaction > 500) {
          patterns.insights.push({
            type: "high-average",
            category,
            message: `High average transaction in ${category}: $${avgTransaction.toFixed(
              2
            )}`,
            suggestion: `Look for more affordable alternatives for ${category.toLowerCase()}.`,
          });
        }
      }
    });

    return patterns;
  } catch (error) {
    console.error("Error analyzing spending patterns:", error);
    throw error;
  }
};

module.exports = {
  detectSpendingPatterns,
  analyzeSpendingPatterns,
};
