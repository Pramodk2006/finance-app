import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  LinearProgress,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTransactions } from "../context/TransactionContext";
import { useBudget } from "../context/BudgetContext";
import { useAuth } from "../context/AuthContext";
import { Add as AddIcon } from "@mui/icons-material";

const DashboardContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  minHeight: "calc(100vh - 64px)",
}));

const DashboardPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  height: "100%",
  minHeight: "200px",
  display: "flex",
  flexDirection: "column",
}));

const TransactionItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  "&:last-child": {
    marginBottom: 0,
  },
}));

const BudgetProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
    backgroundColor:
      value > 80
        ? theme.palette.error.main
        : value > 50
        ? theme.palette.warning.main
        : theme.palette.success.main,
  },
}));

const Dashboard = () => {
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions();
  const { budgets, loading: budgetsLoading, error: budgetsError } = useBudget();
  const { user } = useAuth();

  const { summary, recentTransactions } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        summary: { income: 0, expenses: 0, balance: 0 },
        recentTransactions: [],
      };
    }

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      summary: {
        income,
        expenses,
        balance: income - expenses,
      },
      recentTransactions: recent,
    };
  }, [transactions]);

  const budgetProgress = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];

    return budgets.map((budget) => {
      const spent = budget.spent || 0;
      const amount = budget.amount || 0;
      const progress = (spent / amount) * 100;
      return {
        ...budget,
        progress: Math.min(progress, 100),
        remaining: amount - spent,
      };
    });
  }, [budgets]);

  const loading = transactionsLoading || budgetsLoading;
  const error = transactionsError || budgetsError;

  if (loading) {
    return (
      <DashboardContainer>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Typography color="error">{error}</Typography>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Financial Summary */}
        <Grid item xs={12}>
          <DashboardPaper elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Financial Summary
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  component="div"
                >
                  Income
                </Typography>
                <Typography variant="h5" color="primary" component="div">
                  ${summary.income.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  component="div"
                >
                  Expenses
                </Typography>
                <Typography variant="h5" color="error" component="div">
                  ${summary.expenses.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  component="div"
                >
                  Balance
                </Typography>
                <Typography
                  variant="h5"
                  color={summary.balance >= 0 ? "success.main" : "error.main"}
                  component="div"
                >
                  ${summary.balance.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </DashboardPaper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <DashboardPaper elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Transactions
            </Typography>
            <Box flex={1} overflow="auto">
              {recentTransactions.length > 0 ? (
                <List>
                  {recentTransactions.map((transaction) => (
                    <TransactionItem key={transaction._id}>
                      <ListItemText
                        primary={transaction.description}
                        secondary={new Date(
                          transaction.date
                        ).toLocaleDateString()}
                        primaryTypographyProps={{ component: "div" }}
                        secondaryTypographyProps={{ component: "div" }}
                      />
                      <ListItemSecondaryAction>
                        <Typography
                          variant="body1"
                          color={
                            transaction.type === "income"
                              ? "success.main"
                              : "error.main"
                          }
                          sx={{ fontWeight: "medium" }}
                          component="div"
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {(parseFloat(transaction.amount) || 0).toFixed(2)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </TransactionItem>
                  ))}
                </List>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    component="div"
                  >
                    No transactions yet. Add your first transaction to get
                    started.
                  </Typography>
                </Box>
              )}
            </Box>
          </DashboardPaper>
        </Grid>

        {/* Budget Overview */}
        <Grid item xs={12} md={6}>
          <DashboardPaper elevation={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" component="h2">
                Budget Overview
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                Add Budget
              </Button>
            </Box>
            <Box flex={1} overflow="auto">
              {budgetProgress.length > 0 ? (
                <List>
                  {budgetProgress.map((budget) => (
                    <TransactionItem key={budget._id}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          component="div"
                          gutterBottom
                        >
                          {budget.name || "Unnamed Budget"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          component="div"
                          gutterBottom
                        >
                          {budget.category || "Uncategorized"} •{" "}
                          {budget.period || "monthly"}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <Box flexGrow={1} mr={2}>
                            <BudgetProgress
                              variant="determinate"
                              value={budget.progress}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            component="div"
                          >
                            ${(budget.spent || 0).toFixed(2)} / $
                            {(budget.amount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                      <ListItemSecondaryAction>
                        <Typography
                          variant="body2"
                          color={
                            budget.remaining < 0 ? "error.main" : "success.main"
                          }
                          component="div"
                        >
                          ${Math.abs(budget.remaining).toFixed(2)}{" "}
                          {budget.remaining < 0 ? "over" : "left"}
                        </Typography>
                      </ListItemSecondaryAction>
                    </TransactionItem>
                  ))}
                </List>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    component="div"
                  >
                    No budgets set. Create a budget to track your spending.
                  </Typography>
                </Box>
              )}
            </Box>
          </DashboardPaper>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12}>
          <DashboardPaper elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              AI Insights
            </Typography>
            <Box>
              {transactions && transactions.length > 0 ? (
                <Typography variant="body2" component="div">
                  Based on your spending patterns, our AI recommends creating a
                  budget to better manage your finances.
                </Typography>
              ) : (
                <Typography variant="body2" component="div">
                  Add more transactions to receive personalized financial
                  insights from our AI.
                </Typography>
              )}
            </Box>
          </DashboardPaper>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;
