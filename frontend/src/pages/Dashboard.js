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
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTransactions } from "../context/TransactionContext";
import { useBudget } from "../context/BudgetContext";
import { useAuth } from "../context/AuthContext";
import { useGamification } from "../context/GamificationContext";
import { Add as AddIcon } from "@mui/icons-material";
import AIFinancialAnalysis from "../components/AIFinancialAnalysis";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';

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
  const { 
    level, 
    experience, 
    experienceForNextLevel, 
    weeklyStreak, 
    bestStreak,
    badges,
    addExperience,
    updateFinanceStreak
  } = useGamification();

  // Tracking variables to prevent duplicate experience awards
  const [lastBudgetCheck, setLastBudgetCheck] = useState(null);
  const [lastSavingsCheck, setLastSavingsCheck] = useState(null);
  const [firstTransactionAwarded, setFirstTransactionAwarded] = useState(false);
  const [consistentLoggingAwarded, setConsistentLoggingAwarded] = useState(false);

  // Calculate experience progress
  const experienceProgress = (experience / experienceForNextLevel()) * 100;

  // Check if budget is met and update streak
  useEffect(() => {
    if (budgets && budgets.length > 0) {
      const totalBudget = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const budgetMet = totalExpenses <= totalBudget;
      const savingsDeposited = transactions.some(t => 
        t.type === 'income' && 
        t.category === 'Savings' && 
        new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      // Update finance streak
      updateFinanceStreak(budgetMet, savingsDeposited);
      
      // Award experience for meeting budget - only once per day
      const today = new Date().toISOString().split('T')[0];
      if (budgetMet && lastBudgetCheck !== today) {
        addExperience(10, "Meeting budget goal");
        setLastBudgetCheck(today);
      }
      
      // Award experience for savings - only once per day
      if (savingsDeposited && lastSavingsCheck !== today) {
        addExperience(15, "Making savings deposits");
        setLastSavingsCheck(today);
      }
    }
  }, [budgets, transactions, updateFinanceStreak, addExperience, lastBudgetCheck, lastSavingsCheck]);

  // Award experience for adding transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Check if this is the first transaction - only award once
      if (transactions.length === 1 && !firstTransactionAwarded) {
        addExperience(50, "Adding your first transaction");
        setFirstTransactionAwarded(true);
      }
      
      // Award experience for consistent transaction logging - only once per week
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentTransactions = transactions.filter(t => 
        new Date(t.date) > lastWeek
      );
      
      if (recentTransactions.length >= 5 && !consistentLoggingAwarded) {
        addExperience(20, "Logging transactions consistently");
        setConsistentLoggingAwarded(true);
      }
    }
  }, [transactions, addExperience, firstTransactionAwarded, consistentLoggingAwarded]);

  // Reset weekly awards on Monday
  useEffect(() => {
    const checkDay = () => {
      const today = new Date();
      if (today.getDay() === 1) { // Monday
        setConsistentLoggingAwarded(false);
      }
    };
    
    checkDay();
    const interval = setInterval(checkDay, 24 * 60 * 60 * 1000); // Check once per day
    
    return () => clearInterval(interval);
  }, []);

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
        <Alert severity="error">{error}</Alert>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Gamification Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <DashboardPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Level {level}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Experience
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {experience}/{experienceForNextLevel()} XP
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={experienceProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundImage: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  }
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {experienceForNextLevel() - experience} XP to next level
            </Typography>
          </DashboardPaper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DashboardPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalFireDepartmentIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Weekly Streak</Typography>
            </Box>
            <Typography variant="h3" color="error.main" sx={{ mb: 1 }}>
              {weeklyStreak}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weeklyStreak === 0 
                ? "Start your streak by meeting budget and savings goals" 
                : `Keep it up! Your best streak is ${bestStreak} weeks`}
            </Typography>
          </DashboardPaper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DashboardPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Badges</Typography>
            </Box>
            <Typography variant="h3" color="primary.main" sx={{ mb: 1 }}>
              {badges.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {badges.length === 0 
                ? "Complete achievements to earn badges" 
                : "Keep going to earn more badges!"}
            </Typography>
          </DashboardPaper>
        </Grid>
      </Grid>

      {/* Financial Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
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
            {transactions && transactions.length > 0 ? (
              <AIFinancialAnalysis transactions={transactions} />
            ) : (
              <Box>
                <Typography variant="body2" component="div">
                  Add more transactions to receive personalized financial
                  insights from our AI.
                </Typography>
              </Box>
            )}
          </DashboardPaper>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;

