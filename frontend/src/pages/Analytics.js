import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTransactions } from '../context/TransactionContext';
import { useBudget } from '../context/BudgetContext';

const AnalyticsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const AnalyticsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  height: '100%',
}));

const Analytics = () => {
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions();
  const { budgets } = useBudget();

  const loading = transactionsLoading;
  const error = transactionsError;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <AnalyticsContainer>
        <Typography color="error">{error}</Typography>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AnalyticsPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Coming Soon
            </Typography>
            <Typography variant="body1">
              Advanced analytics features will be available soon, including:
            </Typography>
            <ul>
              <li>Spending trends and patterns</li>
              <li>Category-wise analysis</li>
              <li>Budget vs actual spending</li>
              <li>Financial health metrics</li>
              <li>Custom reports and visualizations</li>
            </ul>
          </AnalyticsPaper>
        </Grid>
      </Grid>
    </AnalyticsContainer>
  );
};

export default Analytics; 