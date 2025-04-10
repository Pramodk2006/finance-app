import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { categorizeTransaction, trainAIModel } from '../services/api';

const AIContext = createContext();

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const getCategoryForTransaction = async (description, amount) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    try {
      const result = await categorizeTransaction(description, amount);
      return result;
    } catch (error) {
      setError('Failed to categorize transaction');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async (transactionId, category, approved) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await trainAIModel(transactionId, category, approved);
      return result;
    } catch (error) {
      setError('Failed to train AI model');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    getCategoryForTransaction,
    trainModel
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export default AIContext;
