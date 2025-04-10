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
  remaining: {
    type: Number,
    default: function() {
      return this.amount;
    },
  },
}, {
  timestamps: true,
});

// Calculate remaining amount before saving
budgetSchema.pre('save', function(next) {
  this.remaining = this.amount - this.spent;
  next();
});

// Check if model exists before creating it
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

module.exports = Budget; 