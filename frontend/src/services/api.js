import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const login = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/users', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to get user profile';
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update profile';
  }
};

// Transaction services
export const getTransactions = async () => {
  try {
    const response = await api.get('/transactions');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch transactions';
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create transaction';
  }
};

export const updateTransaction = async (id, transactionData) => {
  try {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update transaction';
  }
};

export const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete transaction';
  }
};

export const getTransactionStats = async (period) => {
  try {
    const response = await api.get(`/transactions/stats?period=${period}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch transaction stats';
  }
};

// AI services
export const categorizeTransaction = async (description, amount) => {
  try {
    const response = await api.post('/ai/categorize', { description, amount });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to categorize transaction';
  }
};

export const trainAIModel = async (transactionId, category, approved) => {
  try {
    const response = await api.post('/ai/train', { transactionId, category, approved });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to train AI model';
  }
};

// Budget API functions
export const getBudgets = async () => {
  try {
    const response = await api.get('/budgets');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch budgets';
  }
};

export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create budget';
  }
};

export const updateBudget = async (id, budgetData) => {
  try {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update budget';
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete budget';
  }
};

export const updateBudgetSpent = async (id, amount) => {
  try {
    const response = await api.put(`/budgets/${id}/spent`, { amount });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update budget spent amount';
  }
};

// Analytics API functions
export const getSpendingAnalytics = async (period = 'month') => {
  try {
    const response = await api.get(`/analytics/spending?period=${period}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch spending analytics';
  }
};

export const getSpendingInsights = async () => {
  try {
    const response = await api.get('/analytics/insights');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch spending insights';
  }
};

export default api;
