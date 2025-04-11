import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Alert,
  Button,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import api from "../services/api";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#A569BD",
  "#5DADE2",
  "#45B39D",
  "#F4D03F",
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is logged in
      const token = localStorage.getItem("userToken");
      if (!token) {
        setError("Please log in to view analytics");
        return;
      }

      console.log("Fetching analytics for period:", period);

      const [analyticsData, insightsData] = await Promise.all([
        api.get(`/analytics/spending?period=${period}`),
        api.get("/analytics/insights"),
      ]);

      console.log("Raw Analytics Data:", analyticsData);
      console.log("Raw Insights Data:", insightsData);

      // Validate and transform the data
      if (!analyticsData.data) {
        throw new Error("No analytics data received");
      }

      // Transform time series data for the chart
      const timeSeriesData = analyticsData.data.timeSeriesData?.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        amount: parseFloat(item.amount) || 0
      })) || [];

      // Transform category data for the pie chart and bar chart
      const categoryData = analyticsData.data.categories?.map(item => ({
        category: item.category || "Uncategorized",
        amount: parseFloat(item.currentTotal) || 0,
        currentTotal: parseFloat(item.currentTotal) || 0,
        previousTotal: parseFloat(item.previousTotal) || 0
      })) || [];

      console.log("Transformed Time Series Data:", timeSeriesData);
      console.log("Transformed Category Data:", categoryData);

      // Update state with transformed data
      setAnalytics({
        ...analyticsData.data,
        timeSeriesData,
        categories: categoryData
      });
      setInsights(insightsData.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError(error.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const createSampleTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user ID from localStorage
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const currentUserId = userData._id;
      
      if (!currentUserId) {
        setError("User ID not found. Please log in again.");
        return;
      }
      
      console.log("Creating sample transactions for user:", currentUserId);
      
      // Create sample transactions for the current user
      const sampleTransactions = [
        {
          description: "Sample Grocery Shopping",
          amount: 150.50,
          type: "expense",
          category: "Groceries",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          originalDescription: "Sample Grocery Shopping",
          userId: currentUserId // Use userId instead of user
        },
        {
          description: "Sample Restaurant",
          amount: 75.25,
          type: "expense",
          category: "Dining",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          originalDescription: "Sample Restaurant",
          userId: currentUserId
        },
        {
          description: "Sample Salary",
          amount: 3000.00,
          type: "income",
          category: "Salary",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          originalDescription: "Sample Salary",
          userId: currentUserId
        },
        {
          description: "Sample Utilities",
          amount: 120.00,
          type: "expense",
          category: "Utilities",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          originalDescription: "Sample Utilities",
          userId: currentUserId
        }
      ];
      
      console.log("Sample transactions to create:", sampleTransactions);
      
      // Create each transaction
      const createdTransactions = [];
      for (const transaction of sampleTransactions) {
        try {
          const response = await api.post("/transactions", transaction);
          console.log("Transaction created:", response.data);
          createdTransactions.push(response.data);
        } catch (error) {
          console.error("Failed to create transaction:", error);
          console.error("Transaction that failed:", transaction);
        }
      }
      
      console.log("Created transactions:", createdTransactions);
      
      if (createdTransactions.length === 0) {
        setError("Failed to create any transactions. Please check the console for errors.");
      } else {
        // Refresh analytics
        fetchAnalytics();
      }
      
    } catch (error) {
      console.error("Failed to create sample transactions:", error);
      setError("Failed to create sample transactions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Add fallback values for charts
  const spendingTrendsData = analytics?.timeSeriesData || [];
  const categoryData = analytics?.categories || [];
  const largeTransactions = insights?.largeTransactions || [];
  const recurringExpenses = insights?.recurringExpenses || [];
  const totalTransactions = insights?.totalTransactions || 0;
  const averageTransactionAmount = insights?.averageTransactionAmount || 0;
  const mostActiveCategory = insights?.mostActiveCategory || "N/A";

  // Add debug logs to validate the data structure
  console.log("Spending Trends Data:", spendingTrendsData);
  console.log("Category Data:", categoryData);
  console.log("Large Transactions:", largeTransactions);
  console.log("Recurring Expenses:", recurringExpenses);
  console.log("Total Transactions:", totalTransactions);
  console.log("Average Transaction Amount:", averageTransactionAmount);
  console.log("Most Active Category:", mostActiveCategory);

  const renderSpendingTrends = () => {
    if (!analytics?.timeSeriesData?.length) {
      return (
        <Box p={2} textAlign="center">
          <Typography color="textSecondary">
            No spending data available for the selected period
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={analytics.timeSeriesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
            name="Spending"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analytics?.categories?.length) {
      return (
        <Box p={2} textAlign="center">
          <Typography color="textSecondary">
            No category data available for the selected period
          </Typography>
        </Box>
      );
    }

    console.log("Rendering pie chart with data:", analytics.categories);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={analytics.categories}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {analytics.categories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderCategoryBarChart = () => {
    if (!analytics?.categories?.length) {
      return (
        <Box p={2} textAlign="center">
          <Typography color="textSecondary">
            No category data available for the selected period
          </Typography>
        </Box>
      );
    }

    console.log("Rendering bar chart with data:", analytics.categories);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={analytics.categories}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="currentTotal"
            fill="#8884d8"
            name="Current Period"
          />
          <Bar
            dataKey="previousTotal"
            fill="#82ca9d"
            name="Previous Period"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analytics || !insights) {
    return (
      <Box p={3}>
        <Alert severity="info">No analytics data available.</Alert>
      </Box>
    );
  }

  if (spendingTrendsData.length === 0 && categoryData.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No analytics available. Add some expenses to see insights!
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Financial Analytics</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl variant="outlined" size="small">
            <InputLabel id="period-select-label">Period</InputLabel>
            <Select
              labelId="period-select-label"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={createSampleTransactions}
            disabled={loading}
          >
            Create Sample Data
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Spending
              </Typography>
              <Typography variant="h4">
                ${(analytics?.totalSpending || 0).toFixed(2)}
              </Typography>
              <Typography
                color={analytics?.totalChange >= 0 ? "error" : "success"}
                variant="body2"
              >
                {analytics?.totalChange >= 0 ? "+" : ""}
                {(analytics?.totalChange || 0).toFixed(1)}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Monthly Average
              </Typography>
              <Typography variant="h4">
                ${(analytics?.monthlyAverage || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Based on last {period} spending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Savings Rate
              </Typography>
              <Typography variant="h4">
                {(analytics?.savingsRate || 0).toFixed(1)}%
              </Typography>
              <Typography
                color={analytics?.savingsRate >= 20 ? "success" : "warning"}
                variant="body2"
              >
                {analytics?.savingsRate >= 20
                  ? "Healthy savings rate"
                  : "Below recommended 20%"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Spending Trends Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending Trends
            </Typography>
            {renderSpendingTrends()}
          </Paper>
        </Grid>

        {/* Category Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            {renderCategoryBarChart()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            {renderCategoryBreakdown()}
          </Paper>
        </Grid>

        {/* Insights Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Large Transactions</Typography>
                <List>
                  {largeTransactions.map((transaction, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={transaction.description}
                          secondary={`$${(transaction.amount || 0).toFixed(
                            2
                          )} - ${new Date(
                            transaction.date
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {index < largeTransactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Recurring Expenses</Typography>
                <List>
                  {recurringExpenses.map((transaction, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={transaction.description}
                          secondary={`$${(transaction.amount || 0).toFixed(
                            2
                          )} - ${transaction.recurringFrequency}`}
                        />
                      </ListItem>
                      {index < recurringExpenses.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Statistics</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Transactions"
                      secondary={totalTransactions}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Average Transaction"
                      secondary={`$${averageTransactionAmount.toFixed(2)}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Most Active Category"
                      secondary={mostActiveCategory}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
