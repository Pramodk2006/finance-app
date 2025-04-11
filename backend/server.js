const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const dotenv = require("dotenv");
const { errorHandler } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const aiBudgetRoutes = require("./routes/aiBudgetRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Load environment variables with absolute path
const envPath = path.join(__dirname, ".env");
console.log("Loading environment variables from:", envPath);
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "PORT", "GEMINI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

// Create Express app
const app = express();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Make multer available globally
app.locals.upload = upload;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600,
  })
);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
fs.access(uploadsDir)
  .catch(() => fs.mkdir(uploadsDir, { recursive: true }))
  .catch((err) => console.error("Error creating uploads directory:", err));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/aibudget", require("./routes/aiBudgetRoutes"));
app.use("/api/ai-analysis", require("./routes/aiAnalysis"));
app.use("/api/statements", require("./routes/statementRoutes"));
app.use("/api/chat", chatRoutes);

// Health check route
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running" });
});

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require("net");
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      server.close(() => {
        resolve(findAvailablePort(startPort + 1));
      });
    });
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
};

// Start server with dynamic port
const startServer = async () => {
  try {
    const port = await findAvailablePort(parseInt(process.env.PORT) || 5000);

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/finance-app"
    );

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Available routes:");
      console.log("- /api/users");
      console.log("- /api/transactions");
      console.log("- /api/analytics");
      console.log("- /api/budgets");
      console.log("- /api/aibudget");
      console.log("- /api/ai-analysis");
      console.log("- /api/statements");
      console.log("- /api/chat");
      console.log("- /api/status");

      // Update the port in the .env file
      require("fs").writeFileSync(
        envPath,
        require("fs")
          .readFileSync(envPath, "utf8")
          .replace(/PORT=\d+/, `PORT=${port}`)
      );
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Error handling middleware
app.use(errorHandler);

startServer();

module.exports = app;
