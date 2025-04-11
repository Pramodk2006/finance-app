const path = require("path");
const fs = require("fs").promises;
const { createWorker } = require("tesseract.js");
const sharp = require("sharp");
const Transaction = require("../models/transactionModel");
const Statement = require("../models/statementModel");

const processStatement = async (file, userId) => {
  let worker = null;
  try {
    // Initialize worker
    worker = await createWorker();

    // Create statement record
    const statement = await Statement.create({
      user: userId,
      filename: file.filename,
      originalFilename: file.originalname,
      path: file.path,
      status: "processing",
    });

    try {
      // Preprocess image
      const processedImage = await sharp(file.path)
        .resize(2000, null, { fit: "inside" })
        .sharpen()
        .toBuffer();

      // Recognize text
      const {
        data: { text },
      } = await worker.recognize(processedImage);

      // Parse transactions
      const transactions = await parseTransactions(text, userId, statement._id);

      // Update statement
      statement.text = text;
      statement.status = "processed";
      statement.transactionCount = transactions.length;
      await statement.save();

      return statement;
    } catch (error) {
      statement.status = "failed";
      statement.error = error.message;
      await statement.save();
      throw error;
    }
  } catch (error) {
    console.error("Error processing statement:", error);
    throw error;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error("Error terminating worker:", error);
      }
    }
  }
};

const parseTransactions = async (text, userId, statementId) => {
  const transactions = [];
  const lines = text.split("\n");

  // Common transaction patterns and their categories
  const categoryPatterns = {
    "Bills & Utilities": [
      "bill payment",
      "payment",
      "utility",
      "electric",
      "water",
      "gas bill",
      "internet",
      "phone",
      "cable",
      "insurance",
    ],
    Groceries: [
      "grocery",
      "supermarket",
      "food basics",
      "walmart",
      "costco",
      "wholesale",
    ],
    Dining: [
      "restaurant",
      "cafe",
      "coffee",
      "food",
      "dining",
      "takeout",
      "delivery",
    ],
    Transportation: [
      "gas",
      "fuel",
      "transit",
      "uber",
      "lyft",
      "taxi",
      "parking",
      "toll",
    ],
    Shopping: ["store", "shop", "retail", "amazon", "online", "purchase"],
    Entertainment: [
      "movie",
      "netflix",
      "spotify",
      "subscription",
      "entertainment",
      "game",
    ],
    Health: ["pharmacy", "medical", "dental", "doctor", "hospital", "health"],
    "Cash Withdrawal": ["atm", "withdrawal", "cash"],
    Income: ["deposit", "salary", "payroll", "interest", "refund", "credit"],
  };

  for (const line of lines) {
    try {
      // Match amount pattern (e.g., $1,234.56 or -$1,234.56)
      const amountMatch = line.match(/(?:-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (!amountMatch) continue;

      // Match date pattern (e.g., MM/DD/YYYY or MM-DD-YYYY)
      const dateMatch = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
      if (!dateMatch) continue;

      const amount = parseFloat(amountMatch[0].replace(/[^0-9.-]/g, ""));
      const date = new Date(dateMatch[0].replace(/-/g, "/"));

      // Extract description (everything between date and amount)
      const description = line
        .replace(dateMatch[0], "")
        .replace(amountMatch[0], "")
        .trim();

      if (description) {
        // Determine transaction type and category based on description
        let type = "expense"; // Default to expense
        let category = "Uncategorized";
        let aiCategorized = false;

        // Convert description to lowercase for case-insensitive matching
        const lowerDesc = description.toLowerCase();

        // Check for income patterns first
        for (const pattern of categoryPatterns["Income"]) {
          if (lowerDesc.includes(pattern)) {
            type = "income";
            category = "Income";
            aiCategorized = true;
            break;
          }
        }

        // If not income, check other categories
        if (type === "expense") {
          for (const [cat, patterns] of Object.entries(categoryPatterns)) {
            if (
              cat !== "Income" &&
              patterns.some((pattern) => lowerDesc.includes(pattern))
            ) {
              category = cat;
              aiCategorized = true;
              break;
            }
          }
        }

        // Create transaction with all required fields including userId
        const transaction = await Transaction.create({
          userId: userId,
          statementId: statementId,
          date,
          amount: Math.abs(amount),
          type,
          description,
          category,
          aiCategorized,
          originalDescription: description,
        });
        transactions.push(transaction);
      }
    } catch (error) {
      console.error("Error parsing transaction line:", error);
      continue;
    }
  }

  return transactions;
};

module.exports = {
  processStatement,
};
