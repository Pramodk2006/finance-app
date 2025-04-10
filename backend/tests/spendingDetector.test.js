const { detectSpendingPatterns } = require('../services/spendingPatternDetector');
const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

// Mock the Transaction model
jest.mock('../models/transactionModel');

describe('Spending Pattern Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect top spending categories', async () => {
    // Mock transaction data
    const mockTransactions = [
      {
        _id: 'tx1',
        user: 'user123',
        description: 'Rent payment',
        amount: 1200,
        type: 'expense',
        category: 'Housing',
        date: new Date()
      },
      {
        _id: 'tx2',
        user: 'user123',
        description: 'Grocery shopping',
        amount: 200,
        type: 'expense',
        category: 'Groceries',
        date: new Date()
      },
      {
        _id: 'tx3',
        user: 'user123',
        description: 'Restaurant dinner',
        amount: 75,
        type: 'expense',
        category: 'Dining',
        date: new Date()
      }
    ];

    // Setup the mock implementation
    Transaction.find.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockTransactions)
    }));

    // Call the function
    const result = await detectSpendingPatterns('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('patterns');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('summary');
    
    // Check if top categories are detected
    const topCategories = result.patterns.find(p => p.type === 'topCategories');
    expect(topCategories).toBeDefined();
    expect(topCategories.data[0].category).toBe('Housing');
    expect(topCategories.data[0].total).toBe(1200);
  });

  test('should handle empty transaction list', async () => {
    // Setup the mock implementation for empty results
    Transaction.find.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue([])
    }));

    // Call the function
    const result = await detectSpendingPatterns('user123', 'month');

    // Assertions
    expect(result).toHaveProperty('message');
    expect(result.message).toContain('Not enough transaction data');
    expect(result.patterns).toEqual([]);
  });

  test('should detect recurring transactions', async () => {
    // Mock transaction data with recurring patterns
    const mockTransactions = [
      {
        _id: 'tx1',
        user: 'user123',
        description: 'Netflix Subscription',
        amount: 14.99,
        type: 'expense',
        category: 'Entertainment',
        date: new Date('2025-03-15')
      },
      {
        _id: 'tx2',
        user: 'user123',
        description: 'Netflix Subscription',
        amount: 14.99,
        type: 'expense',
        category: 'Entertainment',
        date: new Date('2025-02-15')
      },
      {
        _id: 'tx3',
        user: 'user123',
        description: 'Grocery shopping',
        amount: 85.50,
        type: 'expense',
        category: 'Groceries',
        date: new Date()
      }
    ];

    // Setup the mock implementation
    Transaction.find.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockTransactions)
    }));

    // Call the function
    const result = await detectSpendingPatterns('user123', 'month');

    // Check if recurring transactions are detected
    const recurring = result.patterns.find(p => p.type === 'recurring');
    expect(recurring).toBeDefined();
    expect(recurring.data.some(item => 
      item.category === 'Entertainment' && 
      Math.round(item.amount) === 15 && 
      item.frequency === 2
    )).toBeTruthy();
  });
});
