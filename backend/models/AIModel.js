const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  spendingPatterns: {
    monthlyAverages: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    categoryBreakdown: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    seasonalTrends: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  incomeAnalysis: {
    monthlyAverage: {
      type: Number,
      default: 0,
    },
    stabilityScore: {
      type: Number,
      default: 0,
    },
    growthRate: {
      type: Number,
      default: 0,
    },
  },
  financialHealth: {
    savingsRate: {
      type: Number,
      default: 0,
    },
    debtToIncomeRatio: {
      type: Number,
      default: 0,
    },
    emergencyFundCoverage: {
      type: Number,
      default: 0,
    },
    creditUtilizationScore: {
      type: Number,
      default: 0,
    },
  },
  predictions: {
    nextMonthExpenses: {
      type: Number,
      default: 0,
    },
    savingsProjection: {
      type: Number,
      default: 0,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Method to calculate financial health score
aiModelSchema.methods.calculateFinancialHealthScore = function() {
  const weights = {
    savingsRate: 0.3,
    debtToIncomeRatio: 0.2,
    emergencyFundCoverage: 0.3,
    creditUtilizationScore: 0.2,
  };

  const score = 
    (this.financialHealth.savingsRate * weights.savingsRate) +
    ((1 - this.financialHealth.debtToIncomeRatio) * weights.debtToIncomeRatio) +
    (this.financialHealth.emergencyFundCoverage * weights.emergencyFundCoverage) +
    ((1 - this.financialHealth.creditUtilizationScore) * weights.creditUtilizationScore);

  return Math.min(Math.max(score * 100, 0), 100);
};

// Method to generate personalized financial recommendations
aiModelSchema.methods.generateRecommendations = function() {
  const recommendations = [];

  // Savings rate recommendations
  if (this.financialHealth.savingsRate < 0.2) {
    recommendations.push({
      category: 'Savings',
      priority: 'High',
      message: 'Consider increasing your savings rate to at least 20% of your income.',
      action: 'Review your monthly expenses and identify areas where you can reduce spending.',
    });
  }

  // Emergency fund recommendations
  if (this.financialHealth.emergencyFundCoverage < 3) {
    recommendations.push({
      category: 'Emergency Fund',
      priority: 'High',
      message: 'Build an emergency fund covering at least 3 months of expenses.',
      action: 'Set up automatic transfers to a dedicated savings account.',
    });
  }

  // Debt management recommendations
  if (this.financialHealth.debtToIncomeRatio > 0.4) {
    recommendations.push({
      category: 'Debt Management',
      priority: 'High',
      message: 'Your debt-to-income ratio is above recommended levels.',
      action: 'Consider debt consolidation or creating a debt repayment plan.',
    });
  }

  // Income stability recommendations
  if (this.incomeAnalysis.stabilityScore < 0.7) {
    recommendations.push({
      category: 'Income Stability',
      priority: 'Medium',
      message: 'Your income shows significant variability.',
      action: 'Consider diversifying income sources or building a more stable income stream.',
    });
  }

  return recommendations;
};

module.exports = mongoose.model('AIModel', aiModelSchema); 