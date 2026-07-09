// src/components/DownloadHandler.jsx
import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

const DownloadHandler = ({ 
  url, 
  filename, 
  buttonText = 'Download', 
  variant = 'contained',
  size = 'small',
  startIcon = <DownloadIcon sx={{ fontSize: '0.9rem' }} />,
  sx = {},
  onError = () => {},
  onSuccess = () => {},
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onSuccess();
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={18} /> : startIcon}
      onClick={handleDownload}
      disabled={loading}
      sx={sx}
    >
      {loading ? 'Downloading...' : buttonText}
    </Button>
  );
};

export default DownloadHandler;
