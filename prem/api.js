import axios from 'axios';

const API_URL = `http://localhost:${process.env.REACT_APP_API_PORT || 5007}/api`;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000 // Increased timeout to 30 seconds
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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend server is running.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - The server is taking too long to respond');
      throw new Error('The server is taking too long to respond. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Export the api instance
export { api };

// Auth services
export const login = async (email, password) => {
  try {
    console.log('Attempting login for:', email); // Debug log
    const response = await api.post('/users/login', { email, password });
    
    if (!response.data || !response.data.token) {
      console.error('Invalid login response:', response.data);
      throw new Error('Login failed: Invalid server response');
    }

    // Store auth data
    localStorage.setItem('userToken', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data));
    
    console.log('Login successful'); // Debug log
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    } else if (error.response?.status === 400) {
      throw new Error('Please provide both email and password');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

export const register = async (name, email, password) => {
  try {
    console.log('Registering user:', { name, email }); // Debug log
    const response = await api.post('/users', { name, email, password });
    
    if (!response.data || !response.data.token) {
      console.error('Invalid registration response:', response.data);
      throw new Error('Registration failed: Invalid server response');
    }

    // Store auth data
    localStorage.setItem('userToken', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Invalid registration data. Please check your inputs.');
    } else if (error.response?.status === 409) {
      throw new Error('User already exists with this email.');
    } else {
      throw new Error('Registration failed. Please try again.');
    }
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

// Chatbot specific API call with longer timeout
export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat', { message }, {
      timeout: 30000 // 30 seconds timeout for chatbot requests
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('The chatbot is taking too long to respond. Please try again.');
    }
    throw error;
  }
};
