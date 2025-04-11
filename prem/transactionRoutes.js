const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionById,
  scanReceipt
} = require('../controllers/transactionController');
const Transaction = require('../models/transactionModel');

// Configure multer for this router
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Test route to verify transactions
router.get('/test', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    console.log('Test - Found transactions:', transactions.length);
    console.log('Test - Transaction details:', JSON.stringify(transactions, null, 2));
    res.json({ count: transactions.length, transactions });
  } catch (error) {
    console.error('Test - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Protect all routes
router.use(protect);

// Get transaction statistics
router.get('/stats', getTransactionStats);

// Receipt scanning route with explicit multer middleware
router.post('/scan-receipt', upload.single('receipt'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  next();
}, scanReceipt);

// Basic CRUD operations
router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router; 