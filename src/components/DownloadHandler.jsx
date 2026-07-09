// src/components/DownloadHandler.jsx
import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

const DownloadHandler = ({ 
  url, 
  filename = 'document', 
  buttonText = 'Download', 
  variant = 'contained',
  size = 'small',
  color = 'primary',
  startIcon = <DownloadIcon sx={{ fontSize: '0.9rem' }} />,
  sx = {},
  fullWidth = false,
  onError = () => {},
  onSuccess = () => {},
  showSuccessSnackbar = false,
  showErrorSnackbar = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if URL is valid
      if (!url) {
        throw new Error('Download URL is not available');
      }

      // For blob downloads, use fetch to handle errors better
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Download failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);

      setSuccess(true);
      onSuccess();
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Download error:', err);
      const errorMessage = err.message || 'Failed to download document. Please try again.';
      setError(errorMessage);
      onError(err);
      
      // Auto-hide error message
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Alternative simpler download method using anchor tag directly
  const handleSimpleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onSuccess();
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document. Please try again.');
      onError(err);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color={color}
        startIcon={loading ? <CircularProgress size={18} /> : startIcon}
        onClick={handleDownload}
        disabled={loading || !url}
        fullWidth={fullWidth}
        sx={sx}
      >
        {loading ? 'Downloading...' : buttonText}
      </Button>

      {/* Error Snackbar */}
      {showErrorSnackbar && error && (
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* Success Snackbar */}
      {showSuccessSnackbar && success && (
        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Document downloaded successfully!
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default DownloadHandler;
