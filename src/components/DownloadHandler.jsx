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

  const downloadUrl = podService.getPodDocumentUrl(id, true);
const filename = `${pod.podNumber || 'pod'}.${pod.documentType?.toLowerCase() || 'pdf'}`;

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
   <DownloadHandler
  url={downloadUrl}
  filename={filename}
  buttonText="Download"
  variant="contained"
  size="small"
  startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
  sx={{ fontSize: '0.75rem', py: 0.5, flexShrink: 0 }}
  onError={(err) => setError('Failed to download document')}
/>
  );
};

export default DownloadHandler;
