import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const BudgetsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const BudgetPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const BudgetProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    backgroundColor: value > 80 ? theme.palette.error.main : 
                   value > 50 ? theme.palette.warning.main : 
                   theme.palette.success.main,
  },
}));

const Budgets = () => {
  const { budgets, loading, error, addBudget, editBudget, removeBudget } = useBudget();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState('');

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        amount: budget.amount,
        category: budget.category,
        period: budget.period,
        startDate: new Date(budget.startDate).toISOString().split('T')[0]
      });
    } else {
      setEditingBudget(null);
      setFormData({
        name: '',
        amount: '',
        category: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
    setFormData({
      name: '',
      amount: '',
      category: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user: user._id,
        startDate: new Date(formData.startDate),
        endDate: null
      };

      if (!budgetData.name || !budgetData.amount || !budgetData.category || !budgetData.period) {
        throw new Error('Please fill in all required fields');
      }

      if (editingBudget) {
        await editBudget(editingBudget._id, budgetData);
      } else {
        await addBudget(budgetData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save budget:', error);
      setFormError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await removeBudget(id);
      } catch (error) {
        console.error('Failed to delete budget:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <BudgetsContainer>
        <Typography color="error">{error}</Typography>
      </BudgetsContainer>
    );
  }

  return (
    <BudgetsContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Budgets</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        {budgets && budgets.length > 0 ? (
          budgets.map((budget) => {
            const spent = budget.spent || 0;
            const amount = budget.amount || 0;
            const progress = (spent / amount) * 100;
            const remaining = amount - spent;

            return (
              <Grid item xs={12} md={6} key={budget._id}>
                <BudgetPaper elevation={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{budget.name || 'Unnamed Budget'}</Typography>
                    <Box>
                      <IconButton onClick={() => handleOpenDialog(budget)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(budget._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {budget.category || 'Uncategorized'} • {budget.period || 'monthly'}
                  </Typography>

                  <Box mb={2}>
                    <BudgetProgress variant="determinate" value={Math.min(progress, 100)} />
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      Spent: ${spent.toFixed(2)} / ${amount.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={remaining < 0 ? 'error.main' : 'success.main'}
                    >
                      {remaining < 0 ? 'Over budget' : `Remaining: $${remaining.toFixed(2)}`}
                    </Typography>
                  </Box>
                </BudgetPaper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <BudgetPaper>
              <Typography variant="body1" align="center">
                No budgets created yet. Click the "Add Budget" button to create your first budget.
              </Typography>
            </BudgetPaper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Budget Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                error={!formData.name}
                helperText={!formData.name ? 'Budget name is required' : ''}
              />
              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={!formData.amount}
                helperText={!formData.amount ? 'Amount is required' : ''}
              />
              <TextField
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                fullWidth
                error={!formData.category}
                helperText={!formData.category ? 'Category is required' : ''}
              />
              <TextField
                select
                label="Period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                required
                fullWidth
                error={!formData.period}
                helperText={!formData.period ? 'Period is required' : ''}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
              <TextField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!formData.name || !formData.amount || !formData.category || !formData.period}
            >
              {editingBudget ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </BudgetsContainer>
  );
};

export default Budgets; 