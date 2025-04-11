import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTransactions } from "../context/TransactionContext";
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { api, getTransactions, createTransaction, updateTransaction, deleteTransaction, categorizeTransaction } from '../services/api';

const TransactionsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const TransactionsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  "& .income-cell": {
    color: theme.palette.success.main,
    fontWeight: "bold",
  },
  "& .expense-cell": {
    color: theme.palette.error.main,
    fontWeight: "bold",
  },
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Transactions = () => {
  const { transactions, loading, addTransaction } = useTransactions();
  const [openDialog, setOpenDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date(),
  });

  const columns = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueFormatter: (params) => {
        if (!params || !params.value) return "";
        return new Date(params.value).toLocaleDateString();
      },
    },
    { field: "description", headerName: "Description", width: 200 },
    { field: "category", headerName: "Category", width: 150 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return "";
          const amount = parseFloat(params.value);
          if (isNaN(amount)) return "";

          if (!params.row) return `$${amount.toFixed(2)}`;

          const type = params.row.type || "expense";
          const prefix = type === "income" ? "+" : "-";
          return `${prefix}$${amount.toFixed(2)}`;
        } catch (error) {
          console.error("Error formatting amount:", error);
          return "";
        }
      },
      cellClassName: (params) => {
        try {
          if (!params || !params.row) return "";
          const type = params.row.type || "expense";
          return type === "income" ? "income-cell" : "expense-cell";
        } catch (error) {
          console.error("Error setting cell class:", error);
          return "";
        }
      },
    },
    { field: "type", headerName: "Type", width: 100 },
    {
      field: "aiCategorized",
      headerName: "AI Categorized",
      width: 130,
      valueFormatter: (params) => {
        if (!params || params.value === undefined) return "No";
        return params.value ? "Yes" : "No";
      },
    },
  ];

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: value,
    });
  };

  const handleDateChange = (date) => {
    setNewTransaction({
      ...newTransaction,
      date,
    });
  };

  const handleSubmit = async () => {
    try {
      await addTransaction(newTransaction);
      setNewTransaction({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date(),
      });
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setScanError('Please upload a valid image file (JPEG, PNG)');
      event.target.value = '';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScanError('File size must be less than 5MB');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setScanning(true);
    setScanError(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('Sending request with file:', file.name, 'type:', file.type, 'size:', file.size);

      // Use the API instance for the request
      const response = await fetch(`${api.defaults.baseURL}/transactions/scan-receipt`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // First get the response text
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      // Try to parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse server response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to scan receipt');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      console.log('Parsed response data:', data);

      setNewTransaction({
        ...newTransaction,
        description: data.data.description || '',
        amount: data.data.amount || '',
        category: data.data.category || '',
        date: data.data.date ? new Date(data.data.date) : new Date(),
      });
    } catch (error) {
      console.error('Error scanning receipt:', error.message);
      setScanError(error.message);
      // Clear file selection
      setSelectedFile(null);
      event.target.value = '';
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <TransactionsContainer>
        <Typography>Loading transactions...</Typography>
      </TransactionsContainer>
    );
  }

  if (scanError) {
    return (
      <TransactionsContainer>
        <Typography color="error">{scanError}</Typography>
      </TransactionsContainer>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TransactionsContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Transactions</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            aria-label="Add new transaction"
          >
            Add Transaction
          </Button>
        </Box>

        <TransactionsPaper elevation={2}>
          <div style={{ height: 400, width: "100%" }}>
            {transactions.length > 0 ? (
              <DataGrid
                rows={transactions.map((transaction) => ({
                  ...transaction,
                  id:
                    transaction._id ||
                    transaction.id ||
                    Math.random().toString(36).substr(2, 9),
                }))}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                checkboxSelection
                disableSelectionOnClick
                autoHeight
                density="comfortable"
                getRowHeight={() => "auto"}
                components={{
                  NoRowsOverlay: () => (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body1" color="textSecondary">
                        No transactions yet. Add your first transaction to get
                        started.
                      </Typography>
                    </Box>
                  ),
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  No transactions yet. Add your first transaction to get
                  started.
                </Typography>
              </Box>
            )}
          </div>
        </TransactionsPaper>

        {/* Add Transaction Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="add-transaction-dialog-title"
          disablePortal
          keepMounted
          disableEnforceFocus
          disableAutoFocus
        >
          <DialogTitle id="add-transaction-dialog-title">
            Add New Transaction
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ mr: 2 }}
                disabled={scanning}
              >
                Upload Receipt
                <VisuallyHiddenInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {scanning && <CircularProgress size={24} />}
              {selectedFile && !scanning && (
                <Typography variant="body2" color="textSecondary">
                  {selectedFile.name}
                </Typography>
              )}
            </Box>
            {scanError && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="error" onClose={() => setScanError(null)}>
                  {scanError}
                </Alert>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={newTransaction.type}
                    onChange={handleInputChange}
                    label="Type"
                  >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    <MenuItem value="food">Food</MenuItem>
                    <MenuItem value="transportation">Transportation</MenuItem>
                    <MenuItem value="utilities">Utilities</MenuItem>
                    <MenuItem value="entertainment">Entertainment</MenuItem>
                    <MenuItem value="shopping">Shopping</MenuItem>
                    <MenuItem value="health">Health</MenuItem>
                    <MenuItem value="travel">Travel</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={newTransaction.date}
                  onChange={handleDateChange}
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!newTransaction.description || !newTransaction.amount}
            >
              Add Transaction
            </Button>
          </DialogActions>
        </Dialog>
      </TransactionsContainer>
    </LocalizationProvider>
  );
};

export default Transactions;
