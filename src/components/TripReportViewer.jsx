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
import { tripService } from '../services/tripService';
import { fuelService } from '../services/fuelService';
import { loadService } from '../services/loadService';

// ============================================================
// PROFESSIONAL REPORT HEADER
// ============================================================
const ReportHeader = ({ title, tripNumber, date }) => (
  <Box sx={{ 
    textAlign: 'center', 
    mb: 3, 
    pb: 2, 
    borderBottom: '3px double #4F46E5',
    position: 'relative',
  }}>
    {/* Company Logo Placeholder */}
    <Box sx={{ 
      position: 'absolute', 
      left: 0, 
      top: 0,
      width: 80,
      height: 60,
      bgcolor: '#EEF2FF',
      borderRadius: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #E5E7EB',
    }}>
      <Typography variant="caption" fontWeight="700" color="#4F46E5">
        LOGO
      </Typography>
    </Box>
    
    <Typography variant="h5" fontWeight="700" color="#111827" sx={{ fontSize: '1.3rem' }}>
      {title || 'Trip Report'}
    </Typography>
    <Typography variant="subtitle2" color="#6B7280" sx={{ fontSize: '0.75rem' }}>
      {tripNumber} • Generated: {dayjs(date).format('DD MMM YYYY HH:mm')}
    </Typography>
  </Box>
);

// ============================================================
// REPORT SECTION
// ============================================================
const ReportSection = ({ title, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography 
      variant="subtitle2" 
      fontWeight="600" 
      sx={{ 
        fontSize: '0.8rem', 
        color: '#4F46E5',
        mb: 1,
        borderBottom: '2px solid #EEF2FF',
        pb: 0.5,
      }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

// ============================================================
// INFO ROW
// ============================================================
const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ display: 'flex', py: 0.5, borderBottom: '1px solid #F9FAFB' }}>
    <Box sx={{ width: 140, flexShrink: 0 }}>
      <Typography variant="caption" color="#6B7280" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {Icon && <Icon sx={{ fontSize: '0.7rem', color: '#6B7280' }} />}
      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  </Box>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const TripReportViewer = ({ 
  open, 
  tripNumber, 
  onClose,
  onPrint,
}) => {
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [fuelData, setFuelData] = useState([]);
  const [loadData, setLoadData] = useState(null);

  useEffect(() => {
    if (open && tripNumber) {
      fetchReportData();
    }
  }, [open, tripNumber]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch trip details
      const trip = await tripService.getTripByTripNumber(tripNumber);
      setTripData(trip);

      // Fetch fuel slips
      try {
        const fuel = await fuelService.getFuelSlips({ tripId: trip.id });
        setFuelData(Array.isArray(fuel) ? fuel : []);
      } catch (e) {
        setFuelData([]);
      }

      // Fetch load details
      if (trip.loadId) {
        try {
          const load = await loadService.getLoadByNumber(trip.loadId);
          setLoadData(load);
        } catch (e) {
          setLoadData(null);
        }
      }

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Generating report...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !tripData) {
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

  const trip = tripData;
  const totalFuel = fuelData.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const totalFuelCost = fuelData.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const efficiency = totalFuel > 0 ? (trip.actualDistanceKm || 0) / totalFuel : 0;

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
          Trip Report
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
          {/* Report Header */}
          <ReportHeader 
            title="TRIP REPORT" 
            tripNumber={trip.tripNumber}
            date={new Date()}
          />

          {/* Report Content */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              {/* Trip Details */}
              <ReportSection title="Trip Details">
                <InfoRow label="Trip Number" value={trip.tripNumber} icon={Assignment} />
                <InfoRow label="Status" value={trip.status} icon={CheckCircleIcon} />
                <InfoRow label="Customer" value={trip.customer?.name || trip.customerName} icon={Assignment} />
                <InfoRow label="Reference" value={trip.referenceNumber} icon={Assignment} />
              </ReportSection>

              {/* Route Information */}
              <ReportSection title="Route Information">
                <InfoRow label="Origin" value={trip.originLocation || trip.originCity} icon={LocationOn} />
                <InfoRow label="Destination" value={trip.destinationLocation || trip.destinationCity} icon={LocationOn} />
                <InfoRow label="Distance" value={`${(trip.actualDistanceKm || trip.plannedDistanceKm || 0).toFixed(1)} km`} icon={RouteIcon} />
              </ReportSection>

              {/* Timing */}
              <ReportSection title="Timeline">
                <InfoRow label="Planned Start" value={trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('DD MMM YYYY HH:mm') : 'N/A'} icon={CalendarToday} />
                <InfoRow label="Actual Start" value={trip.actualStartDate ? dayjs(trip.actualStartDate).format('DD MMM YYYY HH:mm') : 'N/A'} icon={ScheduleIcon} />
                <InfoRow label="Planned End" value={trip.plannedEndDate ? dayjs(trip.plannedEndDate).format('DD MMM YYYY HH:mm') : 'N/A'} icon={CalendarToday} />
                <InfoRow label="Actual End" value={trip.actualEndDate ? dayjs(trip.actualEndDate).format('DD MMM YYYY HH:mm') : 'N/A'} icon={ScheduleIcon} />
                <InfoRow label="Duration" value={trip.actualDurationHours ? `${trip.actualDurationHours.toFixed(1)} hours` : 'N/A'} icon={ScheduleIcon} />
              </ReportSection>

              {/* Odometer */}
              <ReportSection title="Odometer Readings">
                <InfoRow label="Start" value={trip.actualStartOdometer ? `${trip.actualStartOdometer.toFixed(2)} km` : 'N/A'} icon={SpeedIcon} />
                <InfoRow label="End" value={trip.actualEndOdometer ? `${trip.actualEndOdometer.toFixed(2)} km` : 'N/A'} icon={SpeedIcon} />
              </ReportSection>
            </Grid>

            <Grid item xs={12} md={5}>
              {/* Driver & Vehicle */}
              <ReportSection title="Driver">
                <InfoRow label="Name" value={trip.driver?.firstName ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` : trip.driverName} icon={PersonIcon} />
                {trip.driver?.licenseNumber && (
                  <InfoRow label="License" value={trip.driver.licenseNumber} icon={Assignment} />
                )}
                {trip.driver?.contactNumber && (
                  <InfoRow label="Contact" value={trip.driver.contactNumber} icon={Assignment} />
                )}
              </ReportSection>

              <ReportSection title="Vehicle">
                <InfoRow label="Registration" value={trip.vehicle?.registrationNumber} icon={DirectionsCar} />
                {trip.vehicle?.make && (
                  <InfoRow label="Make/Model" value={`${trip.vehicle.make} ${trip.vehicle.model || ''}`} icon={DirectionsCar} />
                )}
                {trip.vehicle?.vehicleType && (
                  <InfoRow label="Type" value={trip.vehicle.vehicleType} icon={DirectionsCar} />
                )}
              </ReportSection>

              {/* Fuel Summary */}
              <ReportSection title="Fuel Summary">
                <InfoRow label="Total Fuel" value={`${totalFuel.toFixed(1)} L`} icon={FuelIcon} />
                <InfoRow label="Total Cost" value={`R ${totalFuelCost.toFixed(2)}`} icon={MoneyIcon} />
                <InfoRow label="Efficiency" value={`${efficiency.toFixed(1)} km/L`} icon={SpeedIcon} />
                <InfoRow label="Entries" value={fuelData.length} icon={Assignment} />
              </ReportSection>

              {/* Load Information */}
              {loadData && (
                <ReportSection title="Load Information">
                  <InfoRow label="Load Number" value={loadData.loadNumber} icon={Assignment} />
                  <InfoRow label="Description" value={loadData.description} icon={Assignment} />
                  {loadData.commodityType && (
                    <InfoRow label="Commodity" value={loadData.commodityType} icon={Assignment} />
                  )}
                  {loadData.weightKg && (
                    <InfoRow label="Weight" value={`${loadData.weightKg} kg`} icon={Assignment} />
                  )}
                </ReportSection>
              )}
            </Grid>
          </Grid>

          {/* Fuel Details Table */}
          {fuelData.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', mb: 1 }}>
                Fuel Transaction Details
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Station</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Liters</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Odometer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fuelData.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.6rem' }}>
                          {record.transactionDate ? dayjs(record.transactionDate).format('DD MMM YYYY HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.6rem' }}>{record.stationName || 'N/A'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.6rem' }}>{record.quantity || 0}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.6rem' }}>R {record.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.6rem' }}>R {record.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.6rem' }}>{record.odometerReading || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Footer */}
          <Box sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '1px solid #ECECEC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography variant="caption" color="#6B7280" sx={{ fontSize: '0.6rem' }}>
              Generated by Trailers System • {dayjs().format('DD MMM YYYY HH:mm:ss')}
            </Typography>
            <Typography variant="caption" color="#6B7280" sx={{ fontSize: '0.6rem' }}>
              Page 1 of 1
            </Typography>
          </Box>
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

export default TripReportViewer;
