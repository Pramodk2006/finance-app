import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTransactions } from '../../services/api';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!user) {
    return <div className="error">Please log in to view transactions.</div>;
  }

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="transactions">
      <h1>Transactions</h1>
      
      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found.</p>
        </div>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.description}</td>
                <td>{transaction.category}</td>
                <td className={transaction.type === 'expense' ? 'expense' : 'income'}>
                  {formatAmount(transaction.amount)}
                </td>
                <td>{transaction.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions; 