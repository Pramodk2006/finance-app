const natural = require('natural');
const fs = require('fs');
const path = require('path');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;

// Category keywords for training
const categoryKeywords = {
  'Housing': ['rent', 'mortgage', 'property', 'apartment', 'house', 'landlord', 'lease', 'housing'],
  'Utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'bill', 'utility', 'power', 'energy', 'sewage'],
  'Groceries': ['grocery', 'supermarket', 'food', 'market', 'produce', 'vegetable', 'fruit', 'meat', 'dairy', 'juice', 'beverage'],
  'Dining': ['restaurant', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast', 'takeout', 'delivery', 'bar', 'pub', 'juice', 'smoothie', 'station'],
  'Transportation': ['uber', 'lyft', 'taxi', 'car', 'gas', 'fuel', 'bus', 'train', 'subway', 'transit', 'transport'],
  'Entertainment': ['movie', 'theatre', 'concert', 'show', 'ticket', 'netflix', 'spotify', 'subscription', 'game'],
  'Shopping': ['amazon', 'walmart', 'target', 'store', 'mall', 'shop', 'purchase', 'buy', 'clothing', 'electronics'],
  'Healthcare': ['doctor', 'hospital', 'medical', 'health', 'dental', 'pharmacy', 'prescription', 'medicine', 'clinic'],
  'Income': ['salary', 'paycheck', 'deposit', 'wage', 'income', 'payment', 'revenue', 'earnings', 'transfer'],
  'Education': ['tuition', 'school', 'college', 'university', 'course', 'class', 'book', 'student', 'education'],
  'Personal': ['haircut', 'salon', 'spa', 'gym', 'fitness', 'personal', 'self-care', 'wellness'],
  'Travel': ['hotel', 'flight', 'airbnb', 'vacation', 'trip', 'travel', 'airline', 'booking', 'tour'],
  'Insurance': ['insurance', 'premium', 'coverage', 'policy', 'health insurance', 'car insurance', 'life insurance'],
  'Investments': ['investment', 'stock', 'bond', 'mutual fund', 'etf', 'dividend', 'brokerage', 'retirement'],
  'Miscellaneous': ['other', 'misc', 'miscellaneous', 'general', 'various']
};

// Create a TF-IDF model for category classification
const tfidf = new TfIdf();

// Add category documents to the TF-IDF model
Object.entries(categoryKeywords).forEach(([category, keywords]) => {
  tfidf.addDocument(keywords.join(' '), category);
});

// Preprocess text for classification
const preprocessText = (text) => {
  if (!text) return '';
  
  // Convert to lowercase
  const lowercaseText = text.toLowerCase();
  
  // Tokenize
  const tokens = tokenizer.tokenize(lowercaseText);
  
  // Remove stop words and stem
  const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'by'];
  const filteredTokens = tokens
    .filter(token => !stopWords.includes(token) && token.length > 2)
    .map(token => stemmer.stem(token));
  
  return filteredTokens.join(' ');
};

// Classify transaction description to a category
const classifyTransaction = (description, amount) => {
  const processedText = preprocessText(description);
  
  // If no meaningful text after preprocessing, return Miscellaneous
  if (!processedText) {
    return {
      category: 'Miscellaneous',
      confidence: 0.5,
      method: 'default'
    };
  }
  
  // Check for direct category matches first (rule-based approach)
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        return {
          category,
          confidence: 0.8,
          method: 'keyword-match'
        };
      }
    }
  }
  
  // Use TF-IDF for more complex classification
  let bestCategory = 'Miscellaneous';
  let highestScore = 0;
  
  tfidf.tfidfs(processedText, (i, measure, key) => {
    if (measure > highestScore) {
      highestScore = measure;
      bestCategory = key;
    }
  });
  
  // If the score is too low, default to Miscellaneous
  if (highestScore < 0.1) {
    return {
      category: 'Miscellaneous',
      confidence: 0.5,
      method: 'default'
    };
  }
  
  // Normalize confidence score (0.5 - 0.9)
  const normalizedConfidence = Math.min(0.9, Math.max(0.5, 0.5 + (highestScore / 10)));
  
  return {
    category: bestCategory,
    confidence: normalizedConfidence,
    method: 'tfidf'
  };
};

// Function to train the model with new data
const trainModel = (transactions) => {
  // Reset the TF-IDF model
  const newTfidf = new TfIdf();
  
  // Add base category keywords
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    newTfidf.addDocument(keywords.join(' '), category);
  });
  
  // Add user transactions to improve the model
  transactions.forEach(transaction => {
    if (transaction.description && transaction.category) {
      const processedText = preprocessText(transaction.description);
      if (processedText) {
        newTfidf.addDocument(processedText, transaction.category);
      }
    }
  });
  
  // Save the updated model
  return newTfidf;
};

// Export the model and functions
module.exports = {
  classifyTransaction,
  trainModel,
  preprocessText,
  categoryKeywords
};
