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
  Alert,
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

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching analytics for period:", period);

      const [analyticsData, insightsData] = await Promise.all([
        api.get(`/analytics/spending?period=${period}`),
        api.get("/analytics/insights"),
      ]);

      console.log("Analytics Data:", analyticsData.data);
      console.log("Insights Data:", insightsData.data);

      setAnalytics(analyticsData.data);
      setInsights(insightsData.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError("Failed to load analytics data. Please try again later.");
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
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.timeSeriesData || []}>
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
          </Paper>
        </Grid>

        {/* Category Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.categories || []}>
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
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.categories || []}
                  dataKey="currentTotal"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(analytics?.categories || []).map((entry, index) => (
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
                  {(insights?.largeTransactions || []).map(
                    (transaction, index) => (
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
                        {index < insights.largeTransactions.length - 1 && (
                          <Divider />
                        )}
                      </React.Fragment>
                    )
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Recurring Expenses</Typography>
                <List>
                  {(insights?.recurringExpenses || []).map(
                    (transaction, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={transaction.description}
                            secondary={`$${(transaction.amount || 0).toFixed(
                              2
                            )} - ${transaction.recurringFrequency}`}
                          />
                        </ListItem>
                        {index < insights.recurringExpenses.length - 1 && (
                          <Divider />
                        )}
                      </React.Fragment>
                    )
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Statistics</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Transactions"
                      secondary={insights?.totalTransactions || 0}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Average Transaction"
                      secondary={`$${(
                        insights?.averageTransactionAmount || 0
                      ).toFixed(2)}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Most Active Category"
                      secondary={insights?.mostActiveCategory || "N/A"}
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
