import React, { useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useTransactions } from "../context/TransactionContext";
import { useAuth } from "../context/AuthContext";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const UploadContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const UploadPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const DropzoneBox = styled(Box, {
  shouldForwardProp: (prop) =>
    !["isDragActive", "isDragReject", "isSuccess"].includes(prop),
})(({ theme, isDragActive, isDragReject, isSuccess }) => ({
  border: "2px dashed",
  borderColor: isDragReject
    ? theme.palette.error.main
    : isDragActive
    ? theme.palette.primary.main
    : isSuccess
    ? theme.palette.success.main
    : theme.palette.grey[300],
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(8),
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.3s ease",
  backgroundColor: isDragActive ? theme.palette.action.hover : "transparent",
  width: "100%",
  marginBottom: theme.spacing(3),
}));

const ResultsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const StatementUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState(null);
  const [bank, setBank] = useState("");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const { fetchTransactions } = useTransactions();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);

  // Get the token directly from localStorage
  const token = localStorage.getItem("userToken");

  const onDrop = useCallback(
    async (acceptedFiles) => {
      // Reset states
      setError(null);
      setSuccess(false);
      setResults(null);
      setSelectedFile(null);

      if (acceptedFiles.length === 0) {
        setError("Please select a valid CSV, PDF, or image file (JPG, PNG).");
        return;
      }

      const file = acceptedFiles[0];
      setSelectedFile(file);

      const fileExt = file.name.split(".").pop().toLowerCase();

      if (!["csv", "pdf", "jpg", "jpeg", "png"].includes(fileExt)) {
        setError("Only CSV, PDF, and image files (JPG, PNG) are accepted.");
        return;
      }

      if (!token) {
        setError("You must be logged in to upload files.");
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("statement", file);

        if (bank) {
          formData.append("bank", bank);
        }

        if (dateFormat) {
          formData.append("dateFormat", dateFormat);
        }

        const response = await axios.post(
          "http://localhost:5000/api/statements/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            withCredentials: true,
            timeout: 30000,
          }
        );

        // Clear the selected file and any stored filename
        setSelectedFile(null);
        localStorage.removeItem("lastUploadedStatement");

        setSuccess(true);
        setResults(response.data);

        // Refresh transactions to include newly imported ones
        fetchTransactions();
      } catch (err) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to upload statement. Please make sure the backend server is running and you are logged in."
        );
      } finally {
        setUploading(false);
      }
    },
    [bank, dateFormat, fetchTransactions, token]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/pdf": [".pdf"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      },
      maxFiles: 1,
      multiple: false,
    });

  return (
    <UploadContainer>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Upload Bank Statement
      </Typography>

      <UploadPaper elevation={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="bank-select-label">Bank (Optional)</InputLabel>
              <Select
                labelId="bank-select-label"
                id="bank-select"
                value={bank}
                label="Bank (Optional)"
                onChange={(e) => setBank(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="chase">Chase</MenuItem>
                <MenuItem value="bank_of_america">Bank of America</MenuItem>
                <MenuItem value="wells_fargo">Wells Fargo</MenuItem>
                <MenuItem value="citi">Citibank</MenuItem>
                <MenuItem value="capital_one">Capital One</MenuItem>
                <MenuItem value="discover">Discover</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="date-format-label">Date Format</InputLabel>
              <Select
                labelId="date-format-label"
                id="date-format-select"
                value={dateFormat}
                label="Date Format"
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                <MenuItem value="YYYY/MM/DD">YYYY/MM/DD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, width: "100%" }}>
          <DropzoneBox
            {...getRootProps()}
            isDragActive={isDragActive}
            isDragReject={isDragReject}
            isSuccess={success}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon
              sx={{ fontSize: 48, mb: 2, color: "primary.main" }}
            />
            {selectedFile ? (
              <Typography>Selected file: {selectedFile.name}</Typography>
            ) : (
              <Typography>
                Drag & drop your statement here, or click to select
              </Typography>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Supported formats: CSV, PDF, JPG, PNG
            </Typography>
          </DropzoneBox>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Statement uploaded successfully!
            </Alert>
          )}

          {uploading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </UploadPaper>

      {results && results.transactions && results.transactions.length > 0 && (
        <ResultsContainer>
          <Typography variant="h6" gutterBottom>
            Imported Transactions
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={
                          transaction.type === "income"
                            ? "success.main"
                            : "error.main"
                        }
                        fontWeight="medium"
                      >
                        {transaction.type === "income" ? "+" : "-"}$
                        {parseFloat(transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Reset states for a new upload
                setSuccess(false);
                setResults(null);
              }}
            >
              Upload Another Statement
            </Button>
          </Box>
        </ResultsContainer>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How Bank Statement Upload Works
          </Typography>

          <Typography variant="body2" paragraph>
            Our AI system automatically analyzes your bank statement and:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText
                primary="1. Extracts transaction data from CSV, PDF or images"
                secondary="Uses OCR (Optical Character Recognition) to extract text from screenshots or photos"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Automatically categorizes each transaction"
                secondary="Uses AI to determine the most appropriate category based on the description"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Identifies and skips duplicate transactions"
                secondary="Prevents the same transaction from being imported multiple times"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="4. Updates your dashboard with new insights"
                secondary="See spending patterns, trends, and analytics based on your complete financial history"
              />
            </ListItem>
          </List>

          <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
            <strong>Pro Tip:</strong> For screenshots, make sure the image is
            clear and text is readable. Tables with dates, descriptions, and
            amounts work best.
          </Typography>
        </CardContent>
      </Card>
    </UploadContainer>
  );
};

export default StatementUpload;
