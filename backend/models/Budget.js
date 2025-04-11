const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
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
      set: function (value) {
        return value.trim().toLowerCase();
      },
    },
    period: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
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
      min: 0,
      validate: {
        validator: function (value) {
          // Allow spent to be updated even if it exceeds amount
          return value >= 0;
        },
        message: "Spent amount cannot be negative",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for unique active budgets per category per user
budgetSchema.index(
  { user: 1, category: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Virtual field to calculate remaining budget
budgetSchema.virtual("remaining").get(function () {
  return Math.max(0, this.amount - (this.spent || 0));
});

// Virtual field to calculate percentage spent
budgetSchema.virtual("percentageSpent").get(function () {
  return Math.min(100, ((this.spent || 0) / this.amount) * 100);
});

// Pre-save middleware to ensure spent is a number
budgetSchema.pre("save", function (next) {
  if (typeof this.spent !== "number") {
    this.spent = parseFloat(this.spent) || 0;
  }
  next();
});

// Check if model exists before creating it
const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);

module.exports = Budget;
