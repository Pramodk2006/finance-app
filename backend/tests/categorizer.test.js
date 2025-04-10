const { classifyTransaction } = require('../services/transactionCategorizer');

describe('Transaction Categorizer', () => {
  test('should categorize grocery transactions correctly', () => {
    const result = classifyTransaction('Walmart Grocery Shopping', 75.50);
    expect(result.category).toBe('Groceries');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should categorize restaurant transactions correctly', () => {
    const result = classifyTransaction('Dinner at Italian Restaurant', 45.75);
    expect(result.category).toBe('Dining');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should categorize utility transactions correctly', () => {
    const result = classifyTransaction('Electric Bill Payment', 120.30);
    expect(result.category).toBe('Utilities');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should categorize rent transactions correctly', () => {
    const result = classifyTransaction('Monthly Apartment Rent', 1200);
    expect(result.category).toBe('Housing');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should categorize transportation transactions correctly', () => {
    const result = classifyTransaction('Uber Ride to Airport', 35.25);
    expect(result.category).toBe('Transportation');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should categorize income transactions correctly', () => {
    const result = classifyTransaction('Salary Deposit', 3500);
    expect(result.category).toBe('Income');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should handle ambiguous descriptions', () => {
    const result = classifyTransaction('Payment', 50);
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('confidence');
  });

  test('should handle empty descriptions', () => {
    const result = classifyTransaction('', 100);
    expect(result.category).toBe('Miscellaneous');
  });
});
