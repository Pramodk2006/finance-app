import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from "../services/api";
import { useAuth } from "./AuthContext";

export const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Memoize the fetch functions to prevent unnecessary re-renders
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      setError("Failed to fetch transactions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactionStats = useCallback(
    async (period = "month") => {
      if (!user) return;

      try {
        const data = await getTransactionStats(period);
        setStats(data);
        return data;
      } catch (error) {
        setError("Failed to fetch transaction statistics");
        console.error(error);
      }
    },
    [user]
  );

  // Initialize data when user changes
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (user && !isInitialized) {
        try {
          setLoading(true);
          await Promise.all([fetchTransactions(), fetchTransactionStats()]);
          if (mounted) {
            setIsInitialized(true);
          }
        } catch (error) {
          console.error("Failed to initialize data:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [user, isInitialized, fetchTransactions, fetchTransactionStats]);

  const addTransaction = async (transactionData) => {
    try {
      const newTransaction = await createTransaction(transactionData);
      setTransactions((prev) => [...prev, newTransaction]);
      await fetchTransactionStats();
      return newTransaction;
    } catch (error) {
      console.error('Error in addTransaction:', error);
      setError(error.message || "Failed to add transaction");
      throw error;
    }
  };

  const editTransaction = async (id, transactionData) => {
    try {
      const updatedTransaction = await updateTransaction(id, transactionData);
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction._id === id ? updatedTransaction : transaction
        )
      );
      await fetchTransactionStats();
      return updatedTransaction;
    } catch (error) {
      setError("Failed to update transaction");
      console.error(error);
      throw error;
    }
  };

  const removeTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) =>
        prev.filter((transaction) => transaction._id !== id)
      );
      await fetchTransactionStats();
    } catch (error) {
      setError("Failed to delete transaction");
      console.error(error);
      throw error;
    }
  };

  const value = {
    transactions,
    stats,
    loading,
    error,
    fetchTransactions,
    fetchTransactionStats,
    addTransaction,
    editTransaction,
    removeTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;
