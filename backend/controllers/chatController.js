const asyncHandler = require("express-async-handler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");

// Helper function to get financial data
const getFinancialData = async (userId) => {
  try {
    // Get user's transactions
    const transactions = await Transaction.find({ userId: userId })
      .sort({ date: -1 })
      .limit(50);

    // Get spending by category
    const spendingByCategory = await Transaction.aggregate([
      {
        $match: { userId: userId, type: "expense" }
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    // Get income by category
    const incomeByCategory = await Transaction.aggregate([
      {
        $match: { userId: userId, type: "income" }
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const totalTransactions = await Transaction.countDocuments({
      userId: userId,
    });
    const totalSpent = await Transaction.aggregate([
      { $match: { userId: userId, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalIncome = await Transaction.aggregate([
      { $match: { userId: userId, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return {
      recentTransactions: transactions,
      totalTransactions,
      totalSpent: totalSpent[0]?.total || 0,
      totalIncome: totalIncome[0]?.total || 0,
      spendingByCategory,
      incomeByCategory,
    };
  } catch (error) {
    console.error("Error getting financial data:", error);
    return null;
  }
};

// Helper function to generate the prompt
const generatePrompt = (user, message, financialData) => {
  return `You are a helpful financial assistant for ${user.name}. 
Recent financial overview:
- Total transactions: ${financialData.totalTransactions}
- Total spent: $${financialData.totalSpent}
- Total income: $${financialData.totalIncome}

Recent transactions:
${financialData.recentTransactions
  .map((t) => `- ${t.description}: $${t.amount} (${t.type})`)
  .join("\n")}

User's message: ${message}

Please provide helpful financial advice based on this context. Keep your response concise and practical.`;
};

// @desc    Process chat messages
// @route   POST /api/chat
// @access  Private
const processChatMessage = asyncHandler(async (req, res) => {
  try {
    console.log("Received chat request:", {
      userId: req.user._id,
      message: req.body.message,
    });

    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      console.log("No message provided in request");
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("Found user:", user.name);

    // Get financial data
    const financialData = await getFinancialData(userId);
    console.log("Financial data:", financialData);

    // Generate personalized prompt
    const prompt = generatePrompt(user, message, financialData);
    console.log("Generated prompt:", prompt);

    try {
      // Initialize Gemini API here, after environment variables are loaded
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment variables");
        return res.status(500).json({
          success: false,
          error: "AI service is not configured properly",
        });
      }

      console.log("Initializing Gemini API...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log("Gemini API initialized successfully");

      // Get the Gemini model with updated configuration
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        apiVersion: "v1",
      });
      console.log("Got Gemini model");

      // Generate a response
      console.log("Generating response with Gemini...");
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const response = await result.response;
      const text = response.text();
      console.log("Generated response:", text);

      return res.json({
        success: true,
        message: text,
      });
    } catch (geminiError) {
      console.error("Gemini API error:", geminiError);
      // Return a more detailed error message
      return res.status(500).json({
        success: false,
        error: "Failed to generate response from AI",
        details: geminiError.message,
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process chat message",
      details: error.message,
    });
  }
});

module.exports = {
  processChatMessage,
};
