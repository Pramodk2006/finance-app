import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UploadStatement = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF or image file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('statement', file);

    try {
      const response = await api.post('/statements/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/statements/${response.data._id}`);
      }, 2000);
    } catch (error) {
      console.error('Error uploading statement:', error);
      setError(error.response?.data?.message || 'Failed to upload statement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-statement">
      <h1>Upload Bank Statement</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Statement uploaded successfully! Redirecting...</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="statement">Select Statement File</label>
          <input
            type="file"
            id="statement"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={loading}
          />
          <p className="help-text">Supported formats: PDF, JPG, JPEG, PNG</p>
        </div>

        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload Statement'}
        </button>
      </form>
    </div>
  );
};

export default UploadStatement; 