import React, { useState, useEffect } from "react";
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
} from "recharts";
import api from "../services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, insightsData] = await Promise.all([
        api.get(`/analytics/spending?period=${period}`),
        api.get("/analytics/insights"),
      ]);
      setAnalytics(analyticsData.data);
      setInsights(insightsData.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Spending Analytics</Typography>
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Total Spending Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Spending
              </Typography>
              <Typography variant="h4">
                ${analytics.totalSpending.toFixed(2)}
              </Typography>
              <Typography
                color={analytics.totalChange >= 0 ? "error" : "success"}
                variant="body2"
              >
                {analytics.totalChange >= 0 ? "+" : ""}
                {analytics.totalChange.toFixed(1)}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Average Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Monthly Average
              </Typography>
              <Typography variant="h4">
                ${analytics.monthlyAverage.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Categories Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Top Categories
              </Typography>
              <List>
                {analytics.topCategories.map((category, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={category.category}
                      secondary={`$${category.currentTotal.toFixed(
                        2
                      )} (${category.change.toFixed(1)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Spending by Category Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="currentTotal" fill="#8884d8" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categories}
                  dataKey="currentTotal"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Spending Insights */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Large Transactions</Typography>
                <List>
                  {insights.largeTransactions.map((transaction, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={transaction.description}
                        secondary={`$${transaction.amount.toFixed(
                          2
                        )} - ${new Date(
                          transaction.date
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Recurring Expenses</Typography>
                <List>
                  {insights.recurringExpenses.map((transaction, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={transaction.description}
                        secondary={`$${transaction.amount.toFixed(2)} - ${
                          transaction.recurringFrequency
                        }`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Statistics</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Transactions"
                      secondary={insights.totalTransactions}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Average Transaction"
                      secondary={`$${insights.averageTransactionAmount.toFixed(
                        2
                      )}`}
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
