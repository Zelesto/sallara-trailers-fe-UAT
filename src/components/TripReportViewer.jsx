// src/components/TripReportViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  DirectionsCar,
  Person as PersonIcon,
  LocationOn,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as MoneyIcon,
  Route as RouteIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday,
  Assignment,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { reportService } from '../services/reportService';
import { tripService } from '../services/tripService';
import { fuelService } from '../services/fuelService';
import { loadService } from '../services/loadService';

const TripReportViewer = ({ 
  open, 
  tripNumber, 
  onClose,
  onPrint,
  useFallback = false, // Force HTML fallback
}) => {
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportFormat, setReportFormat] = useState('html');
  const [birtAvailable, setBirtAvailable] = useState(false);

  useEffect(() => {
    if (open && tripNumber) {
      fetchReport();
    }
  }, [open, tripNumber]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if BIRT is available
      const birtStatus = await reportService.checkBirtAvailability();
      setBirtAvailable(birtStatus);

      // Generate report - this handles the fallback internally
      const result = await reportService.generateTripReport(tripNumber);
      
      if (result.success) {
        setReportFormat(result.format);
        setReportData(result.data);
        
        if (result.format === 'birt') {
          // BIRT returned HTML content
          const iframe = document.getElementById('report-frame');
          if (iframe) {
            iframe.srcdoc = result.data;
          }
        }
      } else {
        throw new Error('Failed to generate report');
      }
      
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (reportFormat === 'birt') {
      // Print BIRT report
      const iframe = document.getElementById('report-frame');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
        return;
      }
    }
    // Fallback to HTML print
    window.print();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>
            {birtAvailable ? 'Generating BIRT report...' : 'Generating report...'}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !reportData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            {error || 'Trip not found'}
          </Alert>
          <Button onClick={onClose} sx={{ mt: 2, fontSize: '0.8rem' }}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // If BIRT generated the report, show it in an iframe
  if (reportFormat === 'birt') {
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
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Chip 
              label="BIRT Report" 
              size="small" 
              color="primary" 
              sx={{ mr: 1, height: 18, fontSize: '0.55rem' }}
            />
            {tripNumber}
          </Typography>
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
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <iframe
            id="report-frame"
            style={{
              width: '100%',
              height: 'calc(90vh - 70px)',
              border: 'none',
            }}
            title="Trip Report"
            srcDoc={reportData}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // HTML Fallback Report - Your existing TripReportViewer component
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        ref: printRef,
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
          bgcolor: '#F7F7FC',
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
        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
          <Chip 
            label="HTML Report" 
            size="small" 
            color="secondary" 
            sx={{ mr: 1, height: 18, fontSize: '0.55rem' }}
          />
          {tripNumber}
        </Typography>
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

      <DialogContent sx={{ p: 3, overflow: 'auto' }}>
        <Box ref={printRef}>
          {/* Your existing HTML report content using reportData */}
          <TripReportContent data={reportData} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
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

      {/* Print Styles */}
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
            padding: 20px !important;
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
          .MuiTableCell-root {
            padding: 4px 6px !important;
            font-size: 8px !important;
          }
          .MuiTypography-root {
            font-size: 9px !important;
          }
          .MuiChip-root {
            font-size: 7px !important;
            height: 14px !important;
          }
        }
      `}</style>
    </Dialog>
  );
};

// HTML Report Content Component
const TripReportContent = ({ data }) => {
  const trip = data;
  if (!trip) return <Typography>No data available</Typography>;

  const driverName = trip.driver?.firstName 
    ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` 
    : trip.driverName || 'N/A';
  const vehicleReg = trip.vehicle?.registrationNumber || 'N/A';

  return (
    <Box>
      {/* Report Header */}
      <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '3px double #4F46E5' }}>
        <Typography variant="h5" fontWeight="700" color="#111827" sx={{ fontSize: '1.3rem' }}>
          Trip Report
        </Typography>
        <Typography variant="subtitle2" color="#6B7280" sx={{ fontSize: '0.75rem' }}>
          {trip.tripNumber} • Generated: {dayjs().format('DD MMM YYYY HH:mm')}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          {/* Trip Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', color: '#4F46E5', mb: 1 }}>
              Trip Details
            </Typography>
            <InfoRow label="Trip Number" value={trip.tripNumber} />
            <InfoRow label="Status" value={trip.status} />
            <InfoRow label="Customer" value={trip.customerName} />
            <InfoRow label="Reference" value={trip.referenceNumber} />
          </Box>

          {/* Route Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', color: '#4F46E5', mb: 1 }}>
              Route Information
            </Typography>
            <InfoRow label="Origin" value={trip.originLocation} />
            <InfoRow label="Destination" value={trip.destinationLocation} />
            <InfoRow label="Distance" value={`${(trip.actualDistanceKm || trip.plannedDistanceKm || 0).toFixed(1)} km`} />
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          {/* Driver & Vehicle */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', color: '#4F46E5', mb: 1 }}>
              Driver & Vehicle
            </Typography>
            <InfoRow label="Driver" value={driverName} />
            <InfoRow label="Vehicle" value={vehicleReg} />
            {trip.vehicle?.make && (
              <InfoRow label="Make/Model" value={`${trip.vehicle.make} ${trip.vehicle.model || ''}`} />
            )}
          </Box>

          {/* Timing */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', color: '#4F46E5', mb: 1 }}>
              Timing
            </Typography>
            <InfoRow label="Planned Start" value={trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('DD MMM YYYY HH:mm') : 'N/A'} />
            <InfoRow label="Actual Start" value={trip.actualStartDate ? dayjs(trip.actualStartDate).format('DD MMM YYYY HH:mm') : 'N/A'} />
            <InfoRow label="Planned End" value={trip.plannedEndDate ? dayjs(trip.plannedEndDate).format('DD MMM YYYY HH:mm') : 'N/A'} />
            <InfoRow label="Actual End" value={trip.actualEndDate ? dayjs(trip.actualEndDate).format('DD MMM YYYY HH:mm') : 'N/A'} />
          </Box>

          {/* Odometer */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', color: '#4F46E5', mb: 1 }}>
              Odometer
            </Typography>
            <InfoRow label="Start" value={trip.actualStartOdometer ? `${trip.actualStartOdometer.toFixed(2)} km` : 'N/A'} />
            <InfoRow label="End" value={trip.actualEndOdometer ? `${trip.actualEndOdometer.toFixed(2)} km` : 'N/A'} />
          </Box>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ECECEC' }}>
        <Typography variant="caption" color="#6B7280" sx={{ fontSize: '0.6rem' }}>
          Generated by Trailers System • {dayjs().format('DD MMM YYYY HH:mm:ss')}
        </Typography>
      </Box>
    </Box>
  );
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', py: 0.5, borderBottom: '1px solid #F9FAFB' }}>
    <Box sx={{ width: 130, flexShrink: 0 }}>
      <Typography variant="caption" color="#6B7280" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default TripReportViewer;
