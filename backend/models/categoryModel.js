const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
    color: {
      type: String,
      default: '#6c757d', // Default gray color
    },
    icon: {
      type: String,
      default: 'category',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // For AI suggestions
    keywords: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
