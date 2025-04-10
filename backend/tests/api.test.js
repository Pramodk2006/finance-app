const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

// Test user credentials
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

let token;
let userId;

// Connect to test database before tests
beforeAll(async () => {
  // Clear test collections
  await User.deleteMany({});
  await Transaction.deleteMany({});
});

// Disconnect from database after tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Test authentication routes
describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send(testUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toEqual(testUser.name);
    expect(res.body.email).toEqual(testUser.email);
    
    token = res.body.token;
    userId = res.body._id;
  });

  it('should login a user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toEqual(testUser.email);
  });

  it('should get user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toEqual(testUser.name);
    expect(res.body.email).toEqual(testUser.email);
  });
});

// Test transaction routes
describe('Transaction Routes', () => {
  let transactionId;

  it('should create a new transaction', async () => {
    const transaction = {
      description: 'Grocery shopping',
      amount: 75.50,
      type: 'expense',
      category: 'Groceries',
      date: new Date()
    };

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(transaction);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.description).toEqual(transaction.description);
    expect(res.body.amount).toEqual(transaction.amount);
    expect(res.body.type).toEqual(transaction.type);
    expect(res.body.category).toEqual(transaction.category);
    
    transactionId = res.body._id;
  });

  it('should get all transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a transaction by id', async () => {
    const res = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body._id).toEqual(transactionId);
  });

  it('should update a transaction', async () => {
    const updatedTransaction = {
      description: 'Updated grocery shopping',
      amount: 80.75
    };

    const res = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedTransaction);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.description).toEqual(updatedTransaction.description);
    expect(res.body.amount).toEqual(updatedTransaction.amount);
  });

  it('should delete a transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual('Transaction removed');
  });
});

// Test AI categorization
describe('AI Categorization', () => {
  it('should categorize a transaction', async () => {
    const res = await request(app)
      .post('/api/ai/categorize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Netflix monthly subscription',
        amount: 14.99
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('category');
    expect(res.body).toHaveProperty('confidence');
    expect(res.body).toHaveProperty('method');
  });
});

// Test analytics routes
describe('Analytics Routes', () => {
  beforeAll(async () => {
    // Add multiple transactions for testing analytics
    const transactions = [
      {
        user: userId,
        description: 'Rent payment',
        amount: 1200,
        type: 'expense',
        category: 'Housing',
        date: new Date()
      },
      {
        user: userId,
        description: 'Grocery shopping',
        amount: 85.75,
        type: 'expense',
        category: 'Groceries',
        date: new Date()
      },
      {
        user: userId,
        description: 'Salary deposit',
        amount: 3500,
        type: 'income',
        category: 'Income',
        date: new Date()
      },
      {
        user: userId,
        description: 'Restaurant dinner',
        amount: 65.30,
        type: 'expense',
        category: 'Dining',
        date: new Date()
      }
    ];

    await Transaction.insertMany(transactions);
  });

  it('should get spending patterns', async () => {
    const res = await request(app)
      .get('/api/analytics/spending-patterns')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('patterns');
    expect(res.body).toHaveProperty('insights');
    expect(res.body).toHaveProperty('summary');
  });

  it('should get budget recommendations', async () => {
    const res = await request(app)
      .get('/api/analytics/budget-recommendations')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('recommendations');
  });
});
