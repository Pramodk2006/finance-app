import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import UploadStatement from './UploadStatement';

const Statements = () => {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const response = await api.get('/statements');
      setStatements(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching statements:', error);
      setError(error.response?.data?.message || 'Failed to fetch statements');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'pending';
    }
  };

  if (loading) {
    return <div>Loading statements...</div>;
  }

  return (
    <div className="statements">
      <h1>Bank Statements</h1>
      <UploadStatement onUploadSuccess={fetchStatements} />
      
      {error && <div className="error">{error}</div>}
      
      <div className="statements-list">
        <h2>Uploaded Statements</h2>
        {statements.length === 0 ? (
          <p>No statements uploaded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((statement) => (
                <tr key={statement._id}>
                  <td>{statement.filename}</td>
                  <td>{new Date(statement.createdAt).toLocaleDateString()}</td>
                  <td className={`status ${getStatusColor(statement.status)}`}>
                    {statement.status}
                  </td>
                  <td>{statement.transactionCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Statements; 