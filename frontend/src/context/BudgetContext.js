import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/api";

const BudgetContext = createContext();

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchBudgets = async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getBudgets();
      setBudgets(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  const addBudget = async (budgetData) => {
    try {
      setLoading(true);
      setError(null);
      const newBudget = await createBudget(budgetData);
      setBudgets((prev) => [...prev, newBudget]);
      return newBudget;
    } catch (err) {
      setError(err.message);
      console.error("Error creating budget:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editBudget = async (id, budgetData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedBudget = await updateBudget(id, budgetData);
      setBudgets((prev) =>
        prev.map((budget) => (budget._id === id ? updatedBudget : budget))
      );
      return updatedBudget;
    } catch (err) {
      setError(err.message);
      console.error("Error updating budget:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeBudget = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((budget) => budget._id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting budget:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    budgets,
    loading,
    error,
    addBudget,
    editBudget,
    removeBudget,
    fetchBudgets,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export default BudgetContext;
