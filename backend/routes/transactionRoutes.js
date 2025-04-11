const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  getRecurringTransactions,
  scanReceipt,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const controller = require("../controllers/transactionController");
console.log("Controller contents:", controller);


// Configure multer for receipt uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// All routes are protected
router.use(protect);

// Get transaction statistics
router.get("/stats", getTransactionStats);

// Get transactions by category
router.get("/category/:category", getTransactionsByCategory);

// Get recurring transactions
router.get("/recurring", getRecurringTransactions);

// Scan receipt
router.post("/scan-receipt", upload.single("receipt"), scanReceipt);

// CRUD operations
router.route("/").post(createTransaction).get(getTransactions);

router
  .route("/:id")
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
