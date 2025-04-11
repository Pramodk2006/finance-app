import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const StatementUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Invalid file type. Please upload a JPEG, PNG, PDF, or CSV file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('statement', file);

    try {
      const response = await fetch('http://localhost:5000/api/statements/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload statement');
      }

      setSuccess('Statement uploaded successfully');
      setFile(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload Bank Statement
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <label htmlFor="statement-upload">
          <Input
            accept=".jpg,.jpeg,.png,.pdf,.csv"
            id="statement-upload"
            type="file"
            onChange={handleFileChange}
          />
          <Button variant="contained" component="span">
            Select File
          </Button>
        </label>
        
        {file && (
          <Typography variant="body2">
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        sx={{ mt: 2 }}
      >
        {uploading ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Uploading...
          </>
        ) : (
          'Upload Statement'
        )}
      </Button>
    </Box>
  );
};

export default StatementUpload; 