import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StatementsList = () => {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'processing':
        return 'status-processing';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return <div className="loading">Loading statements...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="statements-list">
      <div className="statements-header">
        <h1>Bank Statements</h1>
        <Link to="/statements/upload" className="upload-button">
          Upload New Statement
        </Link>
      </div>

      {statements.length === 0 ? (
        <div className="no-statements">
          <p>No statements uploaded yet.</p>
          <Link to="/statements/upload" className="upload-button">
            Upload Your First Statement
          </Link>
        </div>
      ) : (
        <table className="statements-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Upload Date</th>
              <th>Status</th>
              <th>Transactions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((statement) => (
              <tr key={statement._id}>
                <td>{statement.originalFilename}</td>
                <td>{formatDate(statement.createdAt)}</td>
                <td>
                  <span className={`status ${getStatusClass(statement.status)}`}>
                    {statement.status}
                  </span>
                </td>
                <td>{statement.transactionCount || 0}</td>
                <td>
                  <Link to={`/statements/${statement._id}`} className="view-link">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StatementsList; 