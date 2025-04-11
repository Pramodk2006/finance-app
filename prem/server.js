const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { errorHandler } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const aiBudgetRoutes = require("./routes/aiBudgetRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Load environment variables with absolute path
const envPath = path.join(__dirname, '.env');
console.log('Loading environment variables from:', envPath);

// Load dotenv
const result = require("dotenv").config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Log environment variables (excluding sensitive ones)
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'undefined');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '***' : 'undefined');

// Verify required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

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

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/ai-budget', aiBudgetRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use(errorHandler);

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
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
    const port = await findAvailablePort(parseInt(process.env.PORT));
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      // Update the port in the .env file
      require('fs').writeFileSync(
        envPath,
        require('fs')
          .readFileSync(envPath, 'utf8')
          .replace(/PORT=\d+/, `PORT=${port}`)
      );
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
