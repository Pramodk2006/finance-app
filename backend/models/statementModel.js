const mongoose = require('mongoose');

const statementSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  filename: {
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
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  text: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Statement', statementSchema); 