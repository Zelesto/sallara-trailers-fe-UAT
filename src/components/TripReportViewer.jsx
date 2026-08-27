// src/components/TripReportViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { reportService } from '../services/reportService';

const TripReportViewer = ({ open, tripNumber, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const [currentFormat, setCurrentFormat] = useState('html');
  const iframeRef = useRef();

  useEffect(() => {
    if (open && tripNumber) {
      generateReport('html');
    }
  }, [open, tripNumber]);

  const generateReport = async (format = 'html') => {
    setLoading(true);
    setError(null);
    setCurrentFormat(format);

    try {
      const result = await reportService.generateTripReport(tripNumber, format);
      
      if (result.success) {
        setReportContent(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
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

  const handleDownload = (format) => {
    generateReport(format);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>
            Generating report...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            {error}
          </Alert>
          <Button onClick={onClose} sx={{ mt: 2, fontSize: '0.8rem' }}>
            Close
          </Button>
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
          bgcolor: '#FFFFFF',
        }
      }}
    >
      <DialogTitle sx={{
        py: 1.5,
        px: 3,
        borderBottom: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Trip Report
          </Typography>
          <Chip
            label={tripNumber}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
          <Chip
            label={currentFormat.toUpperCase()}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton size="small" onClick={() => handleDownload('pdf')}>
              <PdfIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Excel">
            <IconButton size="small" onClick={() => handleDownload('xlsx')}>
              <DownloadIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {currentFormat === 'html' ? (
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: 'calc(90vh - 80px)',
              border: 'none',
            }}
            title="Trip Report"
            srcDoc={reportContent}
            sandbox="allow-scripts allow-same-origin allow-print"
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Report downloaded successfully!
            </Alert>
            <Button
              variant="contained"
              onClick={() => generateReport('html')}
              sx={{ mt: 2 }}
            >
              View HTML Version
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #ECECEC', bgcolor: '#F9FAFB' }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
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
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .MuiDialogActions-root {
            display: none !important;
          }
          .MuiDialogTitle-root .MuiIconButton-root {
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
            width: 100%;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: none !important;
          }
          iframe {
            height: 100% !important;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default TripReportViewer;
