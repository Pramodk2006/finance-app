const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  },
  error: {
    type: String
  },
  transactionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
statementSchema.index({ user: 1, createdAt: -1 });
statementSchema.index({ user: 1, filename: 1 }, { unique: true });

module.exports = mongoose.model('Statement', statementSchema); 