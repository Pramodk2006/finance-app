const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');
const Budget = require('../models/budgetModel');
const { detectSpendingPatterns } = require('./spendingPatternDetector');

// Generate budget recommendations based on spending patterns
const generateBudgetRecommendations = async (userId, period = 'month') => {
  try {
    // Get current budgets
    const currentBudgets = await Budget.find({
      user: mongoose.Types.ObjectId(userId),
      period
    });

    // Get spending patterns
    const spendingAnalysis = await detectSpendingPatterns(userId, period);
    
    if (!spendingAnalysis.patterns || spendingAnalysis.patterns.length === 0) {
      return {
        message: 'Not enough transaction data to generate budget recommendations',
        recommendations: []
      };
    }

    const recommendations = [];
    const categoryTotals = {};
    
    // Extract top spending categories
    const topCategories = spendingAnalysis.patterns.find(p => p.type === 'topCategories');
    if (topCategories && topCategories.data) {
      topCategories.data.forEach(cat => {
        categoryTotals[cat.category] = cat.total;
      });
    }
    
    // Get all expense transactions for the period
    const now = new Date();
    let startDate;
    
    if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }
    
    const transactions = await Transaction.find({
      user: mongoose.Types.ObjectId(userId),
      type: 'expense',
      date: { $gte: startDate }
    });
    
    // Calculate category totals if not already done
    if (Object.keys(categoryTotals).length === 0) {
      transactions.forEach(tx => {
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = 0;
        }
        categoryTotals[tx.category] += tx.amount;
      });
    }
    
    // Calculate total income
    const totalIncome = await Transaction.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(userId),
          type: 'income',
          date: { $gte: startDate }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    const monthlyIncome = totalIncome.length > 0 ? totalIncome[0].total : 0;
    
    // 1. Recommend budgets for categories without budgets
    for (const [category, total] of Object.entries(categoryTotals)) {
      const existingBudget = currentBudgets.find(b => b.category === category);
      
      if (!existingBudget) {
        // Round to nearest 10
        const recommendedAmount = Math.ceil(total / 10) * 10;
        
        recommendations.push({
          type: 'new',
          category,
          currentSpending: total,
          recommendedBudget: recommendedAmount,
          reason: `Based on your spending of $${total.toFixed(2)} on ${category}.`
        });
      }
    }
    
    // 2. Recommend adjustments to existing budgets
    currentBudgets.forEach(budget => {
      const actualSpending = categoryTotals[budget.category] || 0;
      const difference = actualSpending - budget.amount;
      const percentDifference = budget.amount > 0 ? (difference / budget.amount) * 100 : 0;
      
      // If spending is significantly higher or lower than budget
      if (Math.abs(percentDifference) > 20) {
        // Round to nearest 10
        const recommendedAmount = Math.ceil(actualSpending / 10) * 10;
        
        recommendations.push({
          type: 'adjustment',
          category: budget.category,
          currentBudget: budget.amount,
          currentSpending: actualSpending,
          recommendedBudget: recommendedAmount,
          percentDifference: percentDifference,
          reason: percentDifference > 0 
            ? `You're consistently spending ${percentDifference.toFixed(0)}% more than your budget.`
            : `You're consistently spending ${Math.abs(percentDifference).toFixed(0)}% less than your budget.`
        });
      }
    });
    
    // 3. Recommend savings allocation if income > expenses
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    if (monthlyIncome > totalExpenses && monthlyIncome > 0) {
      const surplus = monthlyIncome - totalExpenses;
      const savingsPercentage = (surplus / monthlyIncome) * 100;
      
      if (savingsPercentage < 20 && surplus > 0) {
        // Recommend increasing savings to 20% of income
        const recommendedSavings = monthlyIncome * 0.2;
        const additionalSavings = recommendedSavings - surplus;
        
        recommendations.push({
          type: 'savings',
          currentSavings: surplus,
          recommendedSavings: recommendedSavings,
          additionalSavingsNeeded: additionalSavings,
          currentSavingsPercentage: savingsPercentage,
          targetSavingsPercentage: 20,
          reason: `Financial experts recommend saving at least 20% of your income. You're currently saving ${savingsPercentage.toFixed(1)}%.`
        });
      }
    }
    
    // 4. Recommend reducing spending in top categories if expenses > income
    if (totalExpenses > monthlyIncome && monthlyIncome > 0) {
      const deficit = totalExpenses - monthlyIncome;
      const topSpendingCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      topSpendingCategories.forEach(([category, amount]) => {
        // Recommend reducing by 10-20% depending on the deficit
        const reductionPercentage = Math.min(30, Math.max(10, (deficit / totalExpenses) * 100));
        const recommendedReduction = amount * (reductionPercentage / 100);
        const newBudget = amount - recommendedReduction;
        
        recommendations.push({
          type: 'reduction',
          category,
          currentSpending: amount,
          recommendedBudget: Math.floor(newBudget / 10) * 10,
          reductionAmount: Math.ceil(recommendedReduction / 10) * 10,
          reductionPercentage: reductionPercentage,
          reason: `You're spending more than your income. Reducing ${category} spending by ${reductionPercentage.toFixed(0)}% would help balance your budget.`
        });
      });
    }
    
    // 5. Identify potential subscription services to cut
    const recurringPattern = spendingAnalysis.patterns.find(p => p.type === 'recurring');
    if (recurringPattern && recurringPattern.data) {
      const smallRecurring = recurringPattern.data
        .filter(item => item.amount < 50 && item.amount > 5)
        .sort((a, b) => a.frequency - b.frequency);
      
      if (smallRecurring.length > 0) {
        const leastUsed = smallRecurring[0];
        recommendations.push({
          type: 'subscription',
          category: leastUsed.category,
          amount: leastUsed.amount,
          frequency: leastUsed.frequency,
          annualCost: leastUsed.amount * 12,
          reason: `You have a recurring ${leastUsed.category} expense of $${leastUsed.amount.toFixed(2)} that appears infrequently. Consider if this subscription is worth $${(leastUsed.amount * 12).toFixed(2)} annually.`
        });
      }
    }
    
    return {
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        potentialSavings: recommendations
          .filter(r => r.type === 'reduction' || r.type === 'subscription')
          .reduce((sum, r) => sum + (r.reductionAmount || r.amount || 0), 0),
        currentBudgets: currentBudgets.length,
        totalIncome: monthlyIncome,
        totalExpenses: totalExpenses
      }
    };
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    throw error;
  }
};

module.exports = {
  generateBudgetRecommendations
};
