import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, TextField, 
  Button, FormControl, InputLabel, Select, MenuItem,
  Slider, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const BudgetContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const BudgetPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  // Sample data for charts
  const sampleBudgetData = [
    { name: 'Housing', value: 1200, max: 1500 },
    { name: 'Food', value: 400, max: 500 },
    { name: 'Transportation', value: 200, max: 300 },
    { name: 'Entertainment', value: 150, max: 200 },
    { name: 'Utilities', value: 250, max: 300 },
  ];

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBudget({
      ...newBudget,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // This would normally call the API to save the budget
    const budget = {
      ...newBudget,
      id: Date.now().toString(), // Temporary ID for demo
      isRecommended: false,
      startDate: new Date(),
    };
    
    setBudgets([...budgets, budget]);
    setNewBudget({
      category: '',
      amount: '',
      period: 'monthly',
    });
    handleCloseDialog();
  };

  return (
    <BudgetContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Budget Management</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleOpenDialog}
        >
          Create Budget
        </Button>
      </Box>
      
      {/* Budget Overview */}
      <BudgetPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Budget Overview
        </Typography>
        
        {budgets.length > 0 || sampleBudgetData.length > 0 ? (
          <Grid container spacing={3}>
            {/* Budget Progress */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Budget Progress
              </Typography>
              {sampleBudgetData.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="body2">${item.value} / ${item.max}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(item.value / item.max) * 100} 
                    color={item.value > item.max ? "error" : "primary"}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              ))}
            </Grid>
            
            {/* Budget Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Budget Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sampleBudgetData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="max"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sampleBudgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="body1" color="textSecondary">
              No budgets set. Create a budget to track your spending.
            </Typography>
          </Box>
        )}
      </BudgetPaper>

      {/* Spending vs Budget */}
      <BudgetPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Spending vs Budget
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sampleBudgetData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Bar dataKey="value" name="Actual" fill="#8884d8" />
              <Bar dataKey="max" name="Budget" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </BudgetPaper>

      {/* AI Budget Recommendations */}
      <BudgetPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          AI Budget Recommendations
        </Typography>
        <Typography variant="body2" paragraph>
          Based on your spending patterns, our AI recommends the following budget adjustments:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle1" gutterBottom>
                Reduce Entertainment Budget
              </Typography>
              <Typography variant="body2">
                You've consistently spent less than your entertainment budget. Consider reducing it from $200 to $150 per month.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button size="small" variant="outlined">Apply</Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle1" gutterBottom>
                Increase Food Budget
              </Typography>
              <Typography variant="body2">
                You've exceeded your food budget for 3 consecutive months. Consider increasing it from $500 to $550 per month.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button size="small" variant="outlined">Apply</Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </BudgetPaper>

      {/* Add Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Budget</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="category"
                label="Category"
                fullWidth
                value={newBudget.category}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="amount"
                label="Budget Amount"
                type="number"
                fullWidth
                value={newBudget.amount}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  name="period"
                  value={newBudget.period}
                  label="Period"
                  onChange={handleInputChange}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create Budget
          </Button>
        </DialogActions>
      </Dialog>
    </BudgetContainer>
  );
};

export default Budget;
