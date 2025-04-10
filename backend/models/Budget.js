const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  spent: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate remaining budget
budgetSchema.virtual('remaining').get(function() {
  return this.amount - (this.spent || 0);
});

// Virtual field to calculate percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  return ((this.spent || 0) / this.amount) * 100;
});

// Check if model exists before creating it
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

module.exports = Budget; 