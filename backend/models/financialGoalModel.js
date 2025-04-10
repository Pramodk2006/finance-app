const mongoose = require('mongoose');

const financialGoalSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // For AI recommendations
    recommendedSavingRate: {
      type: Number,
    },
    achievabilityScore: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const FinancialGoal = mongoose.model('FinancialGoal', financialGoalSchema);

module.exports = FinancialGoal;
