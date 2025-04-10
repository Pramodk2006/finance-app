const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { generateBudgetRecommendations } = require('../services/budgetRecommender');
const { detectSpendingPatterns } = require('../services/spendingPatternDetector');

// Mock the models
jest.mock('../models/Budget');
jest.mock('../models/Transaction');

// Mock the required modules
jest.mock('../services/spendingPatternDetector');

describe('Budget Recommender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate new budget recommendations for categories without budgets', async () => {
    // Mock spending patterns
    const mockPatterns = {
      patterns: [
        {
          type: 'topCategories',
          data: [
            { category: 'Housing', total: 1200 },
            { category: 'Groceries', total: 400 },
            { category: 'Dining', total: 300 }
          ]
        }
      ],
      insights: [],
      summary: {
        totalTransactions: 10,
        totalSpending: 2000,
        totalIncome: 3500
      }
    };

    // Mock current budgets (empty)
    Budget.find.mockResolvedValue([]);
    
    // Mock spending patterns detection
    detectSpendingPatterns.mockResolvedValue(mockPatterns);
    
    // Mock transaction aggregation for income
    Transaction.aggregate.mockResolvedValue([{ _id: null, total: 3500 }]);

    // Call the function
    const result = await generateBudgetRecommendations('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('recommendations');
    expect(result.recommendations.length).toBeGreaterThan(0);
    
    // Check if new budget recommendations are generated
    const housingRec = result.recommendations.find(r => r.category === 'Housing');
    expect(housingRec).toBeDefined();
    expect(housingRec.type).toBe('new');
    expect(housingRec.recommendedBudget).toBeGreaterThanOrEqual(1200);
  });

  test('should recommend budget adjustments for existing budgets', async () => {
    // Mock spending patterns
    const mockPatterns = {
      patterns: [
        {
          type: 'topCategories',
          data: [
            { category: 'Housing', total: 1200 },
            { category: 'Groceries', total: 600 }, // Spending more than budget
            { category: 'Entertainment', total: 100 } // Spending less than budget
          ]
        }
      ],
      insights: [],
      summary: {
        totalTransactions: 10,
        totalSpending: 2000,
        totalIncome: 3500
      }
    };

    // Mock current budgets
    Budget.find.mockResolvedValue([
      {
        _id: 'budget1',
        user: 'user123',
        category: 'Groceries',
        amount: 400, // Budget is less than actual spending
        period: 'month'
      },
      {
        _id: 'budget2',
        user: 'user123',
        category: 'Entertainment',
        amount: 200, // Budget is more than actual spending
        period: 'month'
      }
    ]);
    
    // Mock spending patterns detection
    detectSpendingPatterns.mockResolvedValue(mockPatterns);
    
    // Mock transaction aggregation for income
    Transaction.aggregate.mockResolvedValue([{ _id: null, total: 3500 }]);

    // Call the function
    const result = await generateBudgetRecommendations('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('recommendations');
    
    // Check if budget adjustment recommendations are generated
    const groceriesRec = result.recommendations.find(r => r.category === 'Groceries');
    expect(groceriesRec).toBeDefined();
    expect(groceriesRec.type).toBe('adjustment');
    expect(groceriesRec.currentBudget).toBe(400);
    expect(groceriesRec.currentSpending).toBe(600);
    expect(groceriesRec.recommendedBudget).toBeGreaterThanOrEqual(600);
    
    const entertainmentRec = result.recommendations.find(r => r.category === 'Entertainment');
    expect(entertainmentRec).toBeDefined();
    expect(entertainmentRec.type).toBe('adjustment');
    expect(entertainmentRec.currentBudget).toBe(200);
    expect(entertainmentRec.currentSpending).toBe(100);
    expect(entertainmentRec.recommendedBudget).toBeLessThanOrEqual(200);
  });

  test('should recommend savings allocation when income exceeds expenses', async () => {
    // Mock spending patterns
    const mockPatterns = {
      patterns: [
        {
          type: 'topCategories',
          data: [
            { category: 'Housing', total: 1000 },
            { category: 'Groceries', total: 400 },
            { category: 'Dining', total: 200 }
          ]
        }
      ],
      insights: [],
      summary: {
        totalTransactions: 10,
        totalSpending: 1800,
        totalIncome: 3500
      }
    };

    // Mock current budgets
    Budget.find.mockResolvedValue([]);
    
    // Mock spending patterns detection
    detectSpendingPatterns.mockResolvedValue(mockPatterns);
    
    // Mock transaction aggregation for income (high income)
    Transaction.aggregate.mockResolvedValue([{ _id: null, total: 3500 }]);

    // Call the function
    const result = await generateBudgetRecommendations('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('recommendations');
    
    // Check if savings recommendation is generated
    const savingsRec = result.recommendations.find(r => r.type === 'savings');
    expect(savingsRec).toBeDefined();
    expect(savingsRec.currentSavings).toBeGreaterThan(0);
    expect(savingsRec.recommendedSavings).toBeGreaterThanOrEqual(savingsRec.currentSavings);
  });

  test('should handle insufficient transaction data', async () => {
    // Mock empty spending patterns
    detectSpendingPatterns.mockResolvedValue({
      message: 'Not enough transaction data to detect patterns',
      patterns: [],
      insights: []
    });
    
    // Mock current budgets
    Budget.find.mockResolvedValue([]);

    // Call the function
    const result = await generateBudgetRecommendations('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('message');
    expect(result.message).toContain('Not enough transaction data');
    expect(result.recommendations).toEqual([]);
  });
});
