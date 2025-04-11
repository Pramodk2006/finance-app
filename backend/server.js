const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const dotenv = require("dotenv");
const { errorHandler } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.access(uploadsDir)
  .catch(() => fs.mkdir(uploadsDir, { recursive: true }))
  .catch(err => console.error('Error creating uploads directory:', err));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/aibudget", require("./routes/aiBudgetRoutes"));
app.use("/api/ai-analysis", require("./routes/aiAnalysis"));
app.use("/api/statements", require("./routes/statementRoutes"));

// Health check route
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running" });
});

// Environment log
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance-app')
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
      console.log("Available routes:");
      console.log("- /api/users");
      console.log("- /api/transactions");
      console.log("- /api/analytics");
      console.log("- /api/budgets");
      console.log("- /api/aibudget");
      console.log("- /api/ai-analysis");
      console.log("- /api/statements");
      console.log("- /api/status");
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use(errorHandler);

module.exports = app;
