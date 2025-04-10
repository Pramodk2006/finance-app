const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');

// Detect spending patterns and trends
const detectSpendingPatterns = async (userId, period = 'month') => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      throw new Error('Invalid period specified');
    }

    // Get transactions for the specified period
    const transactions = await Transaction.find({
      user: mongoose.Types.ObjectId(userId),
      date: { $gte: startDate }
    }).sort({ date: 1 });

    if (transactions.length === 0) {
      return {
        message: 'Not enough transaction data to detect patterns',
        patterns: [],
        insights: []
      };
    }

    // Group transactions by category
    const categoryGroups = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
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
    const categoryTotals = Object.entries(categoryGroups).map(([category, txns]) => {
      const total = txns.reduce((sum, tx) => sum + tx.amount, 0);
      return { category, total };
    }).sort((a, b) => b.total - a.total);

    if (categoryTotals.length > 0) {
      patterns.push({
        type: 'topCategories',
        data: categoryTotals.slice(0, 3)
      });

      insights.push({
        type: 'topSpending',
        message: `Your top spending category is ${categoryTotals[0].category} with $${categoryTotals[0].total.toFixed(2)}.`
      });
    }

    // 2. Recurring transactions
    const recurringTransactions = [];
    Object.entries(categoryGroups).forEach(([category, txns]) => {
      // Group by similar amounts and descriptions
      const amountGroups = {};
      txns.forEach(tx => {
        const roundedAmount = Math.round(tx.amount);
        if (!amountGroups[roundedAmount]) {
          amountGroups[roundedAmount] = [];
        }
        amountGroups[roundedAmount].push(tx);
      });

      // Check for recurring patterns
      Object.entries(amountGroups).forEach(([amount, amountTxns]) => {
        if (amountTxns.length >= 2) {
          // Check if descriptions are similar
          const descriptions = amountTxns.map(tx => tx.description.toLowerCase());
          const uniqueDescriptions = [...new Set(descriptions)];
          
          if (uniqueDescriptions.length <= 3 && amountTxns.length >= 2) {
            recurringTransactions.push({
              category,
              amount: parseFloat(amount),
              frequency: amountTxns.length,
              transactions: amountTxns
            });
          }
        }
      });
    });

    if (recurringTransactions.length > 0) {
      patterns.push({
        type: 'recurring',
        data: recurringTransactions
      });

      const topRecurring = recurringTransactions.sort((a, b) => b.amount - a.amount)[0];
      insights.push({
        type: 'recurring',
        message: `You have a recurring ${topRecurring.category} expense of $${topRecurring.amount.toFixed(2)} that appears ${topRecurring.frequency} times.`
      });
    }

    // 3. Spending trends over time
    // Group transactions by week or month depending on period
    const timeGroups = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        let timeKey;
        const txDate = new Date(tx.date);
        
        if (period === 'week' || period === 'month') {
          // Group by day
          timeKey = txDate.toISOString().split('T')[0];
        } else {
          // Group by week
          const weekStart = new Date(txDate);
          weekStart.setDate(txDate.getDate() - txDate.getDay());
          timeKey = weekStart.toISOString().split('T')[0];
        }
        
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = 0;
        }
        timeGroups[timeKey] += tx.amount;
      }
    });

    const timeSeriesData = Object.entries(timeGroups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (timeSeriesData.length > 0) {
      patterns.push({
        type: 'timeSeries',
        data: timeSeriesData
      });

      // Detect increasing or decreasing trend
      if (timeSeriesData.length >= 3) {
        const firstHalf = timeSeriesData.slice(0, Math.floor(timeSeriesData.length / 2));
        const secondHalf = timeSeriesData.slice(Math.floor(timeSeriesData.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.amount, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.amount, 0) / secondHalf.length;
        
        const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        
        if (Math.abs(percentChange) >= 10) {
          insights.push({
            type: 'trend',
            message: percentChange > 0 
              ? `Your spending has increased by ${percentChange.toFixed(1)}% compared to the previous period.`
              : `Your spending has decreased by ${Math.abs(percentChange).toFixed(1)}% compared to the previous period.`
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
        const outliers = txns.filter(tx => tx.amount > average * 1.5);
        if (outliers.length > 0) {
          patterns.push({
            type: 'unusual',
            category,
            average,
            outliers
          });
          
          const topOutlier = outliers.sort((a, b) => b.amount - a.amount)[0];
          insights.push({
            type: 'unusual',
            message: `Unusual spending: $${topOutlier.amount.toFixed(2)} on ${category} on ${new Date(topOutlier.date).toLocaleDateString()} is ${((topOutlier.amount / average) * 100 - 100).toFixed(0)}% higher than your average.`
          });
        }
      }
    });

    return {
      patterns,
      insights,
      summary: {
        totalTransactions: transactions.length,
        totalSpending: transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
        totalIncome: transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        categories: categoryTotals
      }
    };
  } catch (error) {
    console.error('Error detecting spending patterns:', error);
    throw error;
  }
};

module.exports = {
  detectSpendingPatterns
};
