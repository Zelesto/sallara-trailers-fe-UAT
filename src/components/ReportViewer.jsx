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

  React.useEffect(() => {
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
          result = await reportService.generateTripReport(params.tripNumber);
          break;
        case 'load':
          result = await reportService.generateLoadReport(params.loadNumber);
          break;
        case 'fuel':
          result = await reportService.generateFuelReport(params.vehicleId, params.startDate, params.endDate);
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
      iframeRef.current.contentWindow.print();
    }
  };

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
      PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{
        py: 1.5,
        px: 3,
        borderBottom: '1px solid #ECECEC',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight="600">{title}</Typography>
          <Chip label={reportType.toUpperCase()} size="small" color="primary" />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: 'calc(90vh - 80px)',
            border: 'none',
          }}
          title="Report"
          srcDoc={reportContent}
          sandbox="allow-scripts allow-same-origin allow-print"
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #ECECEC' }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
        >
          Print / PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportViewer;
