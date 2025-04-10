import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { AIProvider } from './context/AIContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <TransactionProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </TransactionProvider>
    </AuthProvider>
  </React.StrictMode>
); 