import React, { useState, useContext, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { TransactionContext } from "../context/TransactionContext";
import { useAuth } from "../context/AuthContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AIBudget = () => {
  const [monthlySalary, setMonthlySalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState("");
  const { transactions } = useContext(TransactionContext);
  const { user } = useAuth();
  const chartRef = useRef(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const formatAmount = (amount) => {
    // Handle different amount formats
    if (typeof amount === "string") {
      // Remove currency symbol and commas, then convert to float
      return parseFloat(amount.replace(/[$,]/g, ""));
    }
    return parseFloat(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get the token from localStorage
      const token = localStorage.getItem("userToken");

      if (!token) {
        throw new Error("Please log in to use this feature");
      }

      // Format transactions to match the expected structure
      const formattedTransactions = transactions.map((t) => ({
        date: t.date,
        amount:
          t.type === "expense"
            ? -formatAmount(t.amount)
            : formatAmount(t.amount),
        category: t.category,
        type: t.type,
      }));

      console.log(
        "Sending request with transactions:",
        formattedTransactions.length
      );

      const response = await fetch("/api/aibudget/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactions: formattedTransactions,
          monthlySalary: parseFloat(monthlySalary),
        }),
      });

      console.log("Response status:", response.status); // Debug log
      console.log("Response headers:", response.headers); // Debug log

      const responseText = await response.text();
      console.log("Raw response text:", responseText); // Debug log

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError); // Debug log
        console.error("Failed to parse response:", responseText); // Debug log
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        console.error("Error response:", data); // Debug log
        throw new Error(data.error || "Failed to get budget predictions");
      }

      if (!data.success) {
        console.error("Unsuccessful response:", data); // Debug log
        throw new Error(data.error || "Server returned unsuccessful response");
      }

      if (!data.data || typeof data.data !== "object") {
        console.error("Invalid data format:", data); // Debug log
        throw new Error("Invalid prediction data format");
      }

      setPredictions(data.data);
    } catch (err) {
      setError(err.message || "Failed to get budget predictions");
      console.error("Error details:", err); // Debug log
    } finally {
      setLoading(false);
    }
  };

  const renderPredictions = () => {
    if (!predictions) return null;

    const chartData = {
      labels: predictions.forecast_data.dates,
      datasets: [
        {
          label: "Predicted Spending",
          data: predictions.forecast_data.values,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
        {
          label: "Upper Bound",
          data: predictions.forecast_data.upper_bound,
          fill: false,
          borderColor: "rgba(255, 99, 132, 0.2)",
          borderDash: [5, 5],
        },
        {
          label: "Lower Bound",
          data: predictions.forecast_data.lower_bound,
          fill: false,
          borderColor: "rgba(255, 99, 132, 0.2)",
          borderDash: [5, 5],
        },
      ],
    };

    return (
      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget Summary
                </Typography>
                <Typography>
                  Predicted Monthly Spend: $
                  {Math.abs(
                    predictions.predicted_monthly_spend
                  ).toLocaleString()}
                </Typography>
                <Typography>
                  Suggested Savings: $
                  {predictions.suggested_savings.toLocaleString()}
                </Typography>
                <Typography>
                  Available Budget: $
                  {predictions.available_budget.toLocaleString()}
                </Typography>
                <Typography>
                  Average Monthly Spend: $
                  {Math.abs(predictions.average_monthly_spend).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alerts & Insights
                </Typography>
                {predictions.alerts.map((alert, index) => (
                  <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                    {alert}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending Forecast
                </Typography>
                <Box height={400}>
                  <Line
                    ref={chartRef}
                    data={chartData}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) =>
                              `$${Math.abs(value).toLocaleString()}`,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `$${Math.abs(context.raw).toLocaleString()}`,
                          },
                        },
                      },
                    }}
                    id="budget-forecast-chart"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {predictions.category_insights.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Category Insights
                  </Typography>
                  <Grid container spacing={2}>
                    {predictions.category_insights.map((insight, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                          <Typography variant="subtitle1">
                            {insight.category}
                          </Typography>
                          <Typography>
                            Total: $
                            {Math.abs(insight.total_spend).toLocaleString()}
                          </Typography>
                          <Typography>
                            Average: $
                            {Math.abs(insight.average_spend).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        AI Budget Predictions
      </Typography>

      {!user ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please log in to use the AI Budget feature
        </Alert>
      ) : (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Monthly Salary"
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: "$",
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !transactions.length}
              >
                {loading ? <CircularProgress size={24} /> : "Get Predictions"}
              </Button>
              {!transactions.length && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please add some transactions before generating predictions
                </Alert>
              )}
            </form>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderPredictions()}
        </>
      )}
    </Box>
  );
};

export default AIBudget;
