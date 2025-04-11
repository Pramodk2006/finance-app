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
  Tooltip as MuiTooltip,
  IconButton,
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
  Filler,
} from "chart.js";
import { TransactionContext } from "../context/TransactionContext";
import { useAuth } from "../context/AuthContext";
import InfoIcon from '@mui/icons-material/Info';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AIBudget = () => {
  const [monthlySalary, setMonthlySalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState(null);
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
      setSelectedPoint(null);
    } catch (err) {
      setError(err.message || "Failed to get budget predictions");
      console.error("Error details:", err); // Debug log
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleChartClick = (event, elements) => {
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const value = predictions.forecast_data.values[index];
      const date = predictions.forecast_data.dates[index];
      
      setSelectedPoint({
        date,
        value,
        upperBound: predictions.forecast_data.upper_bound[index],
        lowerBound: predictions.forecast_data.lower_bound[index]
      });
    } else {
      setSelectedPoint(null);
    }
  };

  const renderPredictions = () => {
    if (!predictions) return null;

    // Create a gradient for the confidence interval
    const ctx = document.getElementById('budget-forecast-chart');
    let gradient;
    
    if (ctx) {
      const context = ctx.getContext('2d');
      gradient = context.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(255, 99, 132, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 99, 132, 0.05)');
    }

    const chartData = {
      labels: predictions.forecast_data.dates,
      datasets: [
        {
          label: "Predicted Spending",
          data: predictions.forecast_data.values,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.4, // Smoother curve
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(75, 192, 192)",
          pointBorderColor: "white",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: "rgb(75, 192, 192)",
          pointHoverBorderColor: "white",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Upper Bound",
          data: predictions.forecast_data.upper_bound,
          fill: 1, // Fill to the next dataset
          backgroundColor: gradient || "rgba(255, 99, 132, 0.1)",
          borderColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Lower Bound",
          data: predictions.forecast_data.lower_bound,
          fill: 0, // Fill from the previous dataset
          backgroundColor: gradient || "rgba(255, 99, 132, 0.1)",
          borderColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.4,
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Spending Forecast
                  </Typography>
                  <Box>
                    <MuiTooltip title="Zoom out">
                      <IconButton onClick={handleZoomOut} size="small">
                        <ZoomOutIcon />
                      </IconButton>
                    </MuiTooltip>
                    <MuiTooltip title="Zoom in">
                      <IconButton onClick={handleZoomIn} size="small">
                        <ZoomInIcon />
                      </IconButton>
                    </MuiTooltip>
                    <MuiTooltip title="Click on data points to see details">
                      <IconButton size="small">
                        <InfoIcon />
                      </IconButton>
                    </MuiTooltip>
                  </Box>
                </Box>
                
                {selectedPoint && (
                  <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'rgba(75, 192, 192, 0.1)' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Selected Point: {selectedPoint.date}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Predicted Value</Typography>
                        <Typography variant="body1">${Math.abs(selectedPoint.value).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Upper Bound</Typography>
                        <Typography variant="body1">${Math.abs(selectedPoint.upperBound).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Lower Bound</Typography>
                        <Typography variant="body1">${Math.abs(selectedPoint.lowerBound).toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                
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
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          titleColor: '#000',
                          bodyColor: '#000',
                          borderColor: '#ddd',
                          borderWidth: 1,
                          padding: 10,
                          callbacks: {
                            label: (context) => {
                              const label = context.dataset.label || '';
                              const value = context.raw;
                              return `${label}: $${Math.abs(value).toLocaleString()}`;
                            },
                          },
                        },
                        legend: {
                          position: 'top',
                        },
                      },
                      interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                      },
                      onClick: handleChartClick,
                      animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
                      },
                      responsive: true,
                      zoom: {
                        wheel: {
                          enabled: true,
                        },
                        pinch: {
                          enabled: true,
                        },
                        mode: 'xy',
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
