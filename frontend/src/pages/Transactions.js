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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTransactions } from "../context/TransactionContext";

const TransactionsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column'
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

const Transactions = () => {
  const { transactions, loading, error, addTransaction } = useTransactions();
  const [openDialog, setOpenDialog] = useState(false);
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

  if (loading) {
    return (
      <TransactionsContainer>
        <Typography>Loading transactions...</Typography>
      </TransactionsContainer>
    );
  }

  if (error) {
    return (
      <TransactionsContainer>
        <Typography color="error">{error}</Typography>
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

        <TransactionsPaper elevation={2} sx={{ flex: 1 }}>
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
              autoHeight={true}
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
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  required
                  autoFocus
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
                  required
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
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={newTransaction.date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
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
