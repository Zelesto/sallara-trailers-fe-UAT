// src/components/ReportViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { reportService } from '../services/reportService';

const ReportViewer = ({ 
  open, 
  onClose, 
  reportType, 
  params,
  title 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const iframeRef = useRef();

  useEffect(() => {
    if (open && params) {
      generateReport();
    }
  }, [open, params]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      switch (reportType) {
        case 'trip':
          if (!params.tripNumber) {
            throw new Error('Trip number is required');
          }
          result = await reportService.generateTripReport(params.tripNumber);
          break;

        case 'load':
          if (!params.loadNumber) {
            throw new Error('Load number is required');
          }
          result = await reportService.generateLoadReport(params.loadNumber);
          break;

        case 'fuel':
          result = await reportService.generateFuelReport(
            params.vehicleId || null,
            params.startDate || null,
            params.endDate || null
          );
          break;

        case 'driver':
          // For driver report, we might need a different endpoint
          // For now, use trip report with driver filter
          if (!params.driverId) {
            throw new Error('Driver is required');
          }
          // You would call a driver report endpoint here
          result = await reportService.generateTripReport(params.driverId);
          break;

        case 'vehicle':
          if (!params.vehicleId) {
            throw new Error('Vehicle is required');
          }
          // You would call a vehicle report endpoint here
          result = await reportService.generateTripReport(params.vehicleId);
          break;

        case 'custom':
          // Build custom report from parameters
          result = await reportService.generateTripReport(params.tripNumber || '');
          break;

        default:
          throw new Error('Unknown report type');
      }
      
      setReportContent(result);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (e) {
        // If iframe print fails, use window print
        window.print();
      }
    } else {
      window.print();
    }
  };

  const handleRefresh = () => {
    generateReport();
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
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
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
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh}>
              <CircularProgress size={16} />
            </IconButton>
          </Tooltip>
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
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: 'calc(90vh - 80px)',
            border: 'none',
            backgroundColor: '#FFFFFF',
          }}
          title={title || 'Report'}
          srcDoc={reportContent || '<html><body><p>No content</p></body></html>'}
          sandbox="allow-scripts allow-same-origin allow-print allow-modals"
        />
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

      {/* Print styles for the dialog */}
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
