const asyncHandler = require('express-async-handler');
const natural = require('natural');
const Transaction = require('../models/transactionModel');
const Category = require('../models/categoryModel');
const AIModel = require('../models/AIModel');

// Initialize Natural NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// @desc    Categorize a transaction using AI
// @route   POST /api/ai/categorize
// @access  Private
const categorizeTransaction = asyncHandler(async (req, res) => {
  const { description, amount } = req.body;
  
  if (!description) {
    res.status(400);
    throw new Error('Transaction description is required');
  }

  // Get user's categories and their keywords
  const categories = await Category.find({ user: req.user._id });
  
  // If user has no categories, use default categorization
  if (categories.length === 0) {
    const suggestedCategory = getDefaultCategory(description);
    return res.json({ 
      category: suggestedCategory,
      confidence: 0.7,
      method: 'default'
    });
  }

  // Prepare description for matching
  const tokens = tokenizer.tokenize(description.toLowerCase());
  const stems = tokens.map(token => stemmer.stem(token));
  
  // Match against user's categories
  let bestMatch = null;
  let highestScore = 0;
  
  for (const category of categories) {
    if (!category.keywords || category.keywords.length === 0) continue;
    
    let score = 0;
    for (const keyword of category.keywords) {
      const keywordStems = tokenizer.tokenize(keyword.toLowerCase())
        .map(token => stemmer.stem(token));
      
      // Check for keyword matches
      for (const stem of stems) {
        if (keywordStems.includes(stem)) {
          score += 1;
        }
      }
    }
    
    // Normalize score based on number of keywords
    const normalizedScore = score / category.keywords.length;
    
    if (normalizedScore > highestScore) {
      highestScore = normalizedScore;
      bestMatch = category.name;
    }
  }
  
  // If no good match found, use default categorization
  if (highestScore < 0.3 || !bestMatch) {
    const suggestedCategory = getDefaultCategory(description);
    return res.json({ 
      category: suggestedCategory,
      confidence: 0.6,
      method: 'default'
    });
  }
  
  res.json({
    category: bestMatch,
    confidence: highestScore,
    method: 'user-keywords'
  });
});

// @desc    Train AI model with user feedback
// @route   POST /api/ai/train
// @access  Private
const trainAIModel = asyncHandler(async (req, res) => {
  const { transactionId, category, approved } = req.body;
  
  if (!transactionId || !category) {
    res.status(400);
    throw new Error('Transaction ID and category are required');
  }
  
  const transaction = await Transaction.findById(transactionId);
  
  if (!transaction || transaction.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  
  // If user approves the categorization, update the category's keywords
  if (approved) {
    let categoryDoc = await Category.findOne({ 
      user: req.user._id, 
      name: category 
    });
    
    // Create category if it doesn't exist
    if (!categoryDoc) {
      categoryDoc = await Category.create({
        user: req.user._id,
        name: category,
        type: transaction.type || 'expense',
        keywords: []
      });
    }
    
    // Extract keywords from transaction description
    const tokens = tokenizer.tokenize(transaction.description.toLowerCase());
    const significantTokens = tokens.filter(token => 
      token.length > 3 && !isStopWord(token)
    );
    
    // Add new keywords if they don't exist
    let updated = false;
    for (const token of significantTokens) {
      if (!categoryDoc.keywords.includes(token)) {
        categoryDoc.keywords.push(token);
        updated = true;
      }
    }
    
    if (updated) {
      await categoryDoc.save();
    }
    
    // Mark transaction as AI categorized
    transaction.category = category;
    transaction.aiCategorized = true;
    await transaction.save();
    
    res.json({ 
      message: 'AI model trained successfully',
      updatedCategory: categoryDoc
    });
  } else {
    // If user rejects, just update the transaction
    transaction.category = category;
    transaction.aiCategorized = false;
    await transaction.save();
    
    res.json({ 
      message: 'Transaction updated without training'
    });
  }
});

// Helper function to determine default category based on description
const getDefaultCategory = (description) => {
  description = description.toLowerCase();
  
  // Simple rule-based categorization
  if (description.includes('grocery') || description.includes('food') || 
      description.includes('restaurant') || description.includes('cafe')) {
    return 'Food & Dining';
  } else if (description.includes('uber') || description.includes('lyft') || 
             description.includes('taxi') || description.includes('transport')) {
    return 'Transportation';
  } else if (description.includes('rent') || description.includes('mortgage') || 
             description.includes('housing')) {
    return 'Housing';
  } else if (description.includes('netflix') || description.includes('spotify') || 
             description.includes('subscription') || description.includes('entertainment')) {
    return 'Entertainment';
  } else if (description.includes('salary') || description.includes('paycheck') || 
             description.includes('deposit') || description.includes('income')) {
    return 'Income';
  } else if (description.includes('utility') || description.includes('electric') || 
             description.includes('water') || description.includes('gas') || 
             description.includes('bill')) {
    return 'Utilities';
  } else if (description.includes('health') || description.includes('doctor') || 
             description.includes('medical') || description.includes('pharmacy')) {
    return 'Healthcare';
  } else {
    return 'Miscellaneous';
  }
};

// Simple list of stop words
const isStopWord = (word) => {
  const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from'];
  return stopWords.includes(word);
};

// @desc    Get AI insights for the authenticated user
// @route   GET /api/ai/insights
// @access  Private
const getAIInsights = asyncHandler(async (req, res) => {
  const aiModel = await AIModel.findOne({ user: req.user._id });

  if (!aiModel) {
    res.status(404);
    throw new Error('AI model not found for this user');
  }

  const financialHealthScore = aiModel.calculateFinancialHealthScore();
  const recommendations = aiModel.generateRecommendations();

  res.json({
    spendingPatterns: aiModel.spendingPatterns,
    incomeAnalysis: aiModel.incomeAnalysis,
    financialHealth: {
      ...aiModel.financialHealth,
      overallScore: financialHealthScore,
    },
    predictions: aiModel.predictions,
    recommendations,
  });
});

// @desc    Update AI model with new transaction
// @route   POST /api/ai/update
// @access  Private
const updateAIModel = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  let aiModel = await AIModel.findOne({ user: req.user._id });
  if (!aiModel) {
    aiModel = new AIModel({ user: req.user._id });
  }

  // Update spending patterns
  const month = new Date(transaction.date).getMonth();
  const currentMonthlyAvg = aiModel.spendingPatterns.monthlyAverages.get(month) || 0;
  const transactionCount = await Transaction.countDocuments({
    user: req.user._id,
    date: {
      $gte: new Date(new Date().getFullYear(), month, 1),
      $lt: new Date(new Date().getFullYear(), month + 1, 1),
    },
  });

  aiModel.spendingPatterns.monthlyAverages.set(
    month,
    (currentMonthlyAvg * transactionCount + transaction.amount) / (transactionCount + 1)
  );

  // Update category breakdown
  const currentCategoryAmount = aiModel.spendingPatterns.categoryBreakdown.get(transaction.category) || 0;
  aiModel.spendingPatterns.categoryBreakdown.set(
    transaction.category,
    currentCategoryAmount + transaction.amount
  );

  // Update financial health metrics
  const monthlyIncome = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'income',
        date: {
          $gte: new Date(new Date().getFullYear(), month, 1),
          $lt: new Date(new Date().getFullYear(), month + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  if (monthlyIncome.length > 0) {
    aiModel.financialHealth.savingsRate = 
      (monthlyIncome[0].total - aiModel.spendingPatterns.monthlyAverages.get(month)) / monthlyIncome[0].total;
  }

  // Update predictions
  const recentTransactions = await Transaction.find({
    user: req.user._id,
    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  const totalSpending = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  aiModel.predictions.nextMonthExpenses = totalSpending;
  aiModel.predictions.savingsProjection = 
    monthlyIncome.length > 0 ? monthlyIncome[0].total - totalSpending : 0;

  await aiModel.save();

  res.json({
    message: 'AI model updated successfully',
    financialHealthScore: aiModel.calculateFinancialHealthScore(),
  });
});

module.exports = {
  categorizeTransaction,
  trainAIModel,
  getAIInsights,
  updateAIModel,
};
