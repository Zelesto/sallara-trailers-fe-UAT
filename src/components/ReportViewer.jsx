// src/components/ReportViewer.jsx

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ReportViewer = ({ 
  open, 
  onClose, 
  reportType, 
  title,
  htmlContent,
  loading = false,
  error = null,
}) => {
  const iframeRef = useRef();

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (e) {
        window.print();
      }
    } else {
      window.print();
    }
  };

  if (!open) return null;

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2 }}>Generating report...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
          <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: '16px', 
          maxHeight: '90vh',
          overflow: 'hidden',
        } 
      }}
    >
      <DialogTitle sx={{
        py: 1.5,
        px: 3,
        borderBottom: '1px solid #ECECEC',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: '#F9FAFB',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            {title || 'Report'}
          </Typography>
          <Chip 
            label={reportType?.toUpperCase() || 'REPORT'} 
            size="small" 
            color="primary" 
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Print / PDF">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden', flex: 1 }}>
        {htmlContent ? (
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: 'calc(90vh - 80px)',
              border: 'none',
              backgroundColor: '#FFFFFF',
            }}
            title={title || 'Report'}
            srcDoc={htmlContent}
            sandbox="allow-scripts allow-same-origin allow-print allow-modals"
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}>
            <Typography color="text.secondary">No report content available</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid #ECECEC',
        bgcolor: '#F9FAFB',
      }}>
        <Button 
          onClick={onClose} 
          size="small" 
          sx={{ fontSize: '0.8rem', textTransform: 'none' }}
        >
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          size="small"
          startIcon={<PrintIcon sx={{ fontSize: '0.9rem' }} />}
          sx={{ 
            fontSize: '0.8rem', 
            textTransform: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' }
          }}
        >
          Print / PDF
        </Button>
      </DialogActions>

      <style>{`
        @media print {
          .MuiDialog-root .MuiDialog-paper {
            max-height: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .MuiDialogActions-root {
            display: none !important;
          }
          .MuiDialogTitle-root .MuiIconButton-root {
            display: none !important;
          }
          .MuiDialogTitle-root .MuiChip-root {
            display: none !important;
          }
          .MuiDialogContent-root {
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .MuiDialog-paper, .MuiDialog-paper * {
            visibility: visible;
          }
          .MuiDialog-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          iframe {
            height: 100% !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default ReportViewer;
