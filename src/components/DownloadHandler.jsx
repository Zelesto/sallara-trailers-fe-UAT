// src/components/DownloadHandler.jsx
import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';

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
  timeout = 30000, // 30 seconds timeout
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Check if URL is valid
      if (!url) {
        throw new Error('Download URL is not available');
      }

      console.log('📥 Starting download from:', url);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Use axios for better error handling and progress tracking
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'blob', // Important for file downloads
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/pdf,application/octet-stream,*/*',
        },
        timeout: timeout,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
            console.log(`📊 Download progress: ${percentCompleted}%`);
          }
        },
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      console.log('📥 Response data type:', response.data.type);
      console.log('📥 Response data size:', response.data.size);

      // Check if we got a valid blob
      if (!response.data || response.data.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Determine file extension from response or filename
      let fileExtension = 'pdf';
      const contentType = response.headers['content-type'] || response.data.type;
      
      if (contentType) {
        if (contentType.includes('pdf')) fileExtension = 'pdf';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExtension = 'jpg';
        else if (contentType.includes('png')) fileExtension = 'png';
        else if (contentType.includes('msword')) fileExtension = 'doc';
        else if (contentType.includes('wordprocessingml')) fileExtension = 'docx';
      }

      // Ensure filename has correct extension
      let finalFilename = filename;
      if (!finalFilename.includes('.')) {
        finalFilename = `${filename}.${fileExtension}`;
      }

      console.log('📥 Saving as:', finalFilename);

      // Create download link
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);

      setSuccess(true);
      onSuccess();
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      console.log('✅ Download completed successfully');
      
    } catch (err) {
      console.error('❌ Download error:', err);
      
      let errorMessage = 'Failed to download document. Please try again.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You don\'t have permission to download this document.';
        } else if (err.response.status === 404) {
          errorMessage = 'Document not found. The file may have been deleted.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.status === 413) {
          errorMessage = 'File is too large to download.';
        } else {
          // Try to get error message from response
          try {
            const text = await err.response.data.text();
            if (text) {
              try {
                const json = JSON.parse(text);
                if (json.message) errorMessage = json.message;
              } catch (e) {
                errorMessage = text || errorMessage;
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Download timed out. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onError(err);
      
      // Auto-hide error message
      setTimeout(() => {
        setError(null);
      }, 6000);
      
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Simple download method for direct links (e.g., Supabase URLs)
  const handleDirectDownload = () => {
    try {
      console.log('📥 Direct download from:', url);
      
      // Open in new tab for PDFs
      const isPDF = filename.toLowerCase().includes('.pdf') || 
                    url.includes('.pdf');
      
      if (isPDF) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onSuccess();
    } catch (err) {
      console.error('❌ Direct download error:', err);
      setError('Failed to download document. Please try again.');
      onError(err);
    }
  };

  // Determine if URL is a direct file URL (like Supabase)
  const isDirectFileUrl = url && (url.includes('supabase.co') || 
                                  url.includes('storage.googleapis.com') ||
                                  url.includes('.pdf') ||
                                  url.includes('.jpg') ||
                                  url.includes('.png'));

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color={color}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : startIcon}
        onClick={handleDownload}
        disabled={loading || !url}
        fullWidth={fullWidth}
        sx={{
          ...sx,
          position: 'relative',
          '& .MuiCircularProgress-root': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          },
        }}
      >
        {loading ? `Downloading ${progress}%` : buttonText}
      </Button>

      {/* Progress indicator for large files */}
      {loading && progress > 0 && progress < 100 && (
        <div style={{ 
          width: '100%', 
          height: '2px', 
          backgroundColor: '#e0e0e0',
          marginTop: '4px',
          borderRadius: '1px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#1976d2',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Error Snackbar */}
      {showErrorSnackbar && error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ width: '100%' }}
          >
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
          <Alert 
            severity="success" 
            onClose={() => setSuccess(false)}
            sx={{ width: '100%' }}
          >
            Document downloaded successfully!
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default DownloadHandler;
