import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Lightbulb,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AIFinancialAnalysis = ({ transactions }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spendingTrends, setSpendingTrends] = useState(null);

  useEffect(() => {
    if (transactions?.length > 0) {
      console.log("First transaction:", transactions[0]);
      console.log(
        "First transaction amount type:",
        typeof transactions[0].amount
      );
      console.log(
        "All transaction amounts:",
        transactions.map((t) => ({
          amount: t.amount,
          type: typeof t.amount,
        }))
      );
      calculateSpendingTrends();
    }
  }, [transactions]);

  const calculateSpendingTrends = () => {
    // Group transactions by date and calculate daily totals
    const dailyTotals = transactions.reduce((acc, transaction) => {
      const date = transaction.date.split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, expenses: 0, income: 0 };
      }

      console.log("Processing transaction:", {
        amount: transaction.amount,
        type: typeof transaction.amount,
        isNumber: !isNaN(transaction.amount),
      });

      const amount =
        typeof transaction.amount === "string"
          ? parseFloat(transaction.amount.replace(/[^0-9.-]+/g, ""))
          : parseFloat(transaction.amount);

      if (transaction.type === "expense") {
        acc[date].expenses += amount;
      } else {
        acc[date].income += amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    const trendData = Object.values(dailyTotals)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((day) => ({
        ...day,
        date: new Date(day.date).toLocaleDateString(),
      }));

    setSpendingTrends(trendData);
  };

  const getAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Making API call to analyze transactions:", {
        url: "/api/ai-analysis/analyze",
        transactionsCount: transactions?.length,
        firstTransaction: transactions?.[0],
      });

      const response = await axios.post(
        "/api/ai-analysis/analyze",
        {
          transactions,
        },
        {
          baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API response:", response.data);
      setAnalysis(response.data.data);
    } catch (err) {
      console.error("API call failed:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      setError(err.response?.data?.message || "Failed to get AI analysis");
    } finally {
      setLoading(false);
    }
  };

  const getIconForAdviceType = (type) => {
    switch (type) {
      case "warning":
        return <Warning color="warning" />;
      case "success":
        return <CheckCircle color="success" />;
      case "insight":
        return <Lightbulb color="info" />;
      case "alert":
        return <Warning color="error" />;
      case "recommendation":
        return <TrendingUp color="primary" />;
      default:
        return <Info />;
    }
  };

  const renderMetrics = () => {
    if (!analysis?.metrics) return null;

    const { totalIncome, totalExpenses, savingsRate } = analysis.metrics;

    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Financial Overview
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Total Income
                </Typography>
                <Typography variant="h6" color="primary">
                  ${totalIncome.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h6" color="error">
                  ${totalExpenses.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography color="textSecondary" gutterBottom>
                  Savings Rate
                </Typography>
                <Typography
                  variant="h6"
                  color={savingsRate >= 20 ? "success.main" : "warning.main"}
                >
                  {savingsRate.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderSpendingTrends = () => {
    if (!spendingTrends?.length) return null;

    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Spending Trends
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f44336"
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#4caf50"
                    name="Income"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderAdvice = () => {
    if (!analysis?.advice?.length) return null;

    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          AI Financial Advice
        </Typography>
        <List>
          {analysis.advice.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>{getIconForAdviceType(item.type)}</ListItemIcon>
                <ListItemText primary={item.message} secondary={item.action} />
              </ListItem>
              {index < analysis.advice.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">AI Financial Analysis</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={getAnalysis}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
        >
          {loading ? "Analyzing..." : "Analyze Transactions"}
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderMetrics()}
          {renderSpendingTrends()}
          {renderAdvice()}
        </>
      )}
    </Box>
  );
};

export default AIFinancialAnalysis;
