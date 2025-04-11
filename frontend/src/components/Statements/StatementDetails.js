import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StatementDetails = () => {
  const { id } = useParams();
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStatementDetails();
  }, [id]);

  const fetchStatementDetails = async () => {
    try {
      const [statementResponse, transactionsResponse] = await Promise.all([
        api.get(`/statements/${id}`),
        api.get(`/statements/${id}/transactions`)
      ]);
      
      setStatement(statementResponse.data);
      setTransactions(transactionsResponse.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching statement details:', error);
      setError(error.response?.data?.message || 'Failed to fetch statement details');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div>Loading statement details...</div>;
  }

  if (!statement) {
    return <div>Statement not found</div>;
  }

  return (
    <div className="statement-details">
      <h1>Statement Details</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="statement-info">
        <h2>{statement.filename}</h2>
        <p>Uploaded on: {new Date(statement.createdAt).toLocaleString()}</p>
        <p>Status: <span className={`status ${statement.status}`}>{statement.status}</span></p>
      </div>

      <div className="transactions-list">
        <h2>Transactions</h2>
        {transactions.length === 0 ? (
          <p>No transactions found in this statement.</p>
        ) : (
          <table>
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
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
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
    </div>
  );
};

export default StatementDetails; 