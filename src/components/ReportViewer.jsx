// src/components/ReportViewer.jsx

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  FileCopy as CopyIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const ReportViewer = ({ 
  open, 
  onClose, 
  title, 
  reportData, 
  reportType = 'trip',
  onPrint,
}) => {
  const printRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportPDF = () => {
    // This will use the browser's print to PDF functionality
    window.print();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleCopyToClipboard = () => {
    if (!reportData) return;
    
    const textContent = generateTextReport(reportData, reportType);
    navigator.clipboard.writeText(textContent);
  };

  const generateTextReport = (data, type) => {
    switch (type) {
      case 'trip':
        return generateTripTextReport(data);
      case 'fuel':
        return generateFuelTextReport(data);
      case 'load':
        return generateLoadTextReport(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  };

  const generateTripTextReport = (trip) => {
    if (!trip) return 'No trip data available';
    
    return `
TRIP REPORT
============
Trip: ${trip.tripNumber || 'N/A'}
Status: ${trip.status || 'N/A'}
Customer: ${trip.customer?.name || trip.customerName || 'N/A'}

ROUTE
-----
Origin: ${trip.originLocation || trip.originCity || 'N/A'}
Destination: ${trip.destinationLocation || trip.destinationCity || 'N/A'}
Distance: ${trip.actualDistanceKm || trip.plannedDistanceKm || 0} km

VEHICLE
-------
Registration: ${trip.vehicle?.registrationNumber || 'N/A'}
Make/Model: ${trip.vehicle?.make || 'N/A'} ${trip.vehicle?.model || 'N/A'}

DRIVER
------
Name: ${trip.driver?.firstName || trip.driverName || 'N/A'}
License: ${trip.driver?.licenseNumber || 'N/A'}

TIMING
------
Planned Start: ${trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleString() : 'N/A'}
Planned End: ${trip.plannedEndDate ? new Date(trip.plannedEndDate).toLocaleString() : 'N/A'}
Actual Start: ${trip.actualStartDate ? new Date(trip.actualStartDate).toLocaleString() : 'N/A'}
Actual End: ${trip.actualEndDate ? new Date(trip.actualEndDate).toLocaleString() : 'N/A'}

ODOMETER
--------
Start: ${trip.actualStartOdometer || 'N/A'} km
End: ${trip.actualEndOdometer || 'N/A'} km

Generated: ${new Date().toLocaleString()}
    `;
  };

  const generateFuelTextReport = (data) => {
    if (!data || data.length === 0) return 'No fuel data available';
    
    let text = 'FUEL REPORT\n============\n\n';
    text += `Total Records: ${data.length}\n`;
    text += `Total Fuel Used: ${data.reduce((sum, d) => sum + (d.quantity || 0), 0).toFixed(1)} L\n`;
    text += `Total Cost: R ${data.reduce((sum, d) => sum + (d.totalAmount || 0), 0).toFixed(2)}\n\n`;
    text += 'DETAILS\n-------\n';
    
    data.forEach((d, i) => {
      text += `${i + 1}. ${d.stationName || 'Unknown Station'}\n`;
      text += `   Date: ${d.transactionDate ? new Date(d.transactionDate).toLocaleString() : 'N/A'}\n`;
      text += `   Liters: ${d.quantity || 0}\n`;
      text += `   Cost: R ${d.totalAmount || 0}\n`;
      text += `   Odometer: ${d.odometerReading || 'N/A'}\n\n`;
    });
    
    text += `Generated: ${new Date().toLocaleString()}`;
    return text;
  };

  const generateLoadTextReport = (load) => {
    if (!load) return 'No load data available';
    
    return `
LOAD REPORT
============
Load: ${load.loadNumber || 'N/A'}
Status: ${load.status || 'N/A'}
Customer: ${load.customerName || 'N/A'}

DETAILS
-------
Description: ${load.description || 'N/A'}
Commodity: ${load.commodityType || 'N/A'}
Weight: ${load.weightKg || 0} kg
Pallets: ${load.palletCount || 0}

DISTANCE
--------
Total Distance: ${load.totalDistanceKm || 0} km
From Depot: ${load.totalFromDepotKm || 0} km
To Depot: ${load.totalToDepotKm || 0} km

Trips: ${load.trips?.length || 0}

Generated: ${new Date().toLocaleString()}
    `;
  };

  if (!open) return null;

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
          height: '90vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        py: 1.5, 
        px: 2.5, 
        borderBottom: '1px solid #ECECEC',
        bgcolor: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <DescriptionIcon sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            {title || 'Report'}
          </Typography>
          <Chip
            label={reportType.toUpperCase()}
            size="small"
            sx={{ 
              fontSize: '0.55rem', 
              height: 20,
              bgcolor: '#EEF2FF',
              color: '#4F46E5',
            }}
          />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', px: 1 }}>
            {zoomLevel}%
          </Typography>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="Copy to Clipboard">
            <IconButton size="small" onClick={handleCopyToClipboard}>
              <CopyIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton size="small" onClick={handleExportPDF}>
              <PdfIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading report...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              {error}
            </Alert>
          </Box>
        ) : reportData ? (
          <Box 
            ref={printRef}
            sx={{ 
              p: { xs: 2, sm: 3, md: 4 },
              bgcolor: '#FFFFFF',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              width: `${100 / (zoomLevel / 100)}%`,
              minHeight: '100%',
            }}
          >
            {renderReportContent(reportData, reportType)}
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No data to display</Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ 
        p: 1.5, 
        px: 2.5, 
        borderTop: '1px solid #ECECEC',
        bgcolor: '#F9FAFB',
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          Generated: {new Date().toLocaleString()}
        </Typography>
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

      {/* Print Styles */}
      <style>{`
        @media print {
          .MuiDialog-root .MuiDialog-paper {
            max-height: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
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
            box-shadow: none !important;
          }
          .MuiDialogContent-root {
            padding: 0 !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
};

// ============================================================
// RENDER REPORT CONTENT
// ============================================================

const renderReportContent = (data, type) => {
  switch (type) {
    case 'trip':
      return <TripReportContent trip={data} />;
    case 'fuel':
      return <FuelReportContent fuelData={data} />;
    case 'load':
      return <LoadReportContent load={data} />;
    default:
      return <GenericReportContent data={data} />;
  }
};

// ============================================================
// TRIP REPORT CONTENT
// ============================================================

const TripReportContent = ({ trip }) => {
  if (!trip) return <Typography>No trip data available</Typography>;

  const actualDistance = trip.actualDistanceKm || trip.plannedDistanceKm || 0;
  const driverName = trip.driver?.firstName 
    ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` 
    : trip.driverName || 'N/A';
  const vehicleReg = trip.vehicle?.registrationNumber || 'N/A';

  return (
    <Box>
      {/* Logo and Header */}
      <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '2px solid #4F46E5' }}>
        <Typography variant="h5" fontWeight="700" color="#4F46E5" gutterBottom>
          Trip Report
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {trip.tripNumber || 'N/A'} • {trip.status || 'N/A'}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" color="text.secondary">Distance</Typography>
            <Typography variant="h6" fontWeight="600">{actualDistance.toFixed(1)} km</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" color="text.secondary">Duration</Typography>
            <Typography variant="h6" fontWeight="600">
              {trip.actualDurationHours ? `${trip.actualDurationHours.toFixed(1)}h` : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" color="text.secondary">Cost</Typography>
            <Typography variant="h6" fontWeight="600">
              {trip.costAmount ? `R ${trip.costAmount.toFixed(2)}` : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Typography variant="h6" fontWeight="600">{trip.status || 'N/A'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Details */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Route</Typography>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Origin:</strong> {trip.originLocation || trip.originCity || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Destination:</strong> {trip.destinationLocation || trip.destinationCity || 'N/A'}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Driver & Vehicle</Typography>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Driver:</strong> {driverName}</Typography>
            <Typography variant="body2"><strong>Vehicle:</strong> {vehicleReg}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================
// FUEL REPORT CONTENT
// ============================================================

const FuelReportContent = ({ fuelData }) => {
  if (!fuelData || fuelData.length === 0) {
    return <Typography>No fuel data available</Typography>;
  }

  const totalLiters = fuelData.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalCost = fuelData.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '2px solid #D97706' }}>
        <Typography variant="h5" fontWeight="700" color="#D97706" gutterBottom>
          Fuel Report
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {fuelData.length} records • {totalLiters.toFixed(1)} L • R {totalCost.toFixed(2)}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Station</TableCell>
              <TableCell align="right">Liters</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Odometer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fuelData.map((record, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{record.transactionDate ? new Date(record.transactionDate).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{record.stationName || 'N/A'}</TableCell>
                <TableCell align="right">{record.quantity || 0}</TableCell>
                <TableCell align="right">R {record.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                <TableCell align="right">R {record.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell align="right">{record.odometerReading || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ============================================================
// LOAD REPORT CONTENT
// ============================================================

const LoadReportContent = ({ load }) => {
  if (!load) return <Typography>No load data available</Typography>;

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '2px solid #059669' }}>
        <Typography variant="h5" fontWeight="700" color="#059669" gutterBottom>
          Load Report
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {load.loadNumber || 'N/A'} • {load.status || 'N/A'}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Details</Typography>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Description:</strong> {load.description || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Commodity:</strong> {load.commodityType || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Weight:</strong> {load.weightKg || 0} kg</Typography>
            <Typography variant="body2"><strong>Pallets:</strong> {load.palletCount || 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Distance</Typography>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Total:</strong> {load.totalDistanceKm || 0} km</Typography>
            <Typography variant="body2"><strong>From Depot:</strong> {load.totalFromDepotKm || 0} km</Typography>
            <Typography variant="body2"><strong>To Depot:</strong> {load.totalToDepotKm || 0} km</Typography>
            <Typography variant="body2"><strong>Trips:</strong> {load.trips?.length || 0}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================
// GENERIC REPORT CONTENT
// ============================================================

const GenericReportContent = ({ data }) => {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '2px solid #6B7280' }}>
        <Typography variant="h5" fontWeight="700" color="#6B7280" gutterBottom>
          Report
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Generated: {new Date().toLocaleString()}
        </Typography>
      </Box>
      <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
        <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

// ============================================================
// CHIP COMPONENT (if not available in your project)
// ============================================================

const Chip = ({ label, size = 'medium', sx = {}, color = 'default' }) => {
  const bgColors = {
    default: '#F3F4F6',
    primary: '#EEF2FF',
    success: '#D1FAE5',
    error: '#FEE2E2',
    warning: '#FEF3C7',
    info: '#DBEAFE',
  };
  
  const textColors = {
    default: '#6B7280',
    primary: '#4F46E5',
    success: '#065F46',
    error: '#991B1B',
    warning: '#92400E',
    info: '#1E40AF',
  };

  return (
    <Box
      sx={{
        display: 'inline-block',
        px: size === 'small' ? 1 : 1.5,
        py: size === 'small' ? 0.25 : 0.5,
        borderRadius: '16px',
        bgcolor: bgColors[color] || bgColors.default,
        color: textColors[color] || textColors.default,
        fontSize: size === 'small' ? '0.6rem' : '0.75rem',
        fontWeight: 600,
        ...sx,
      }}
    >
      {label}
    </Box>
  );
};

// ============================================================
// TABLE COMPONENTS (if not available in your project)
// ============================================================

const TableContainer = ({ children, component = 'div', sx = {}, ...props }) => (
  <Box component={component} sx={{ overflow: 'auto', ...sx }} {...props}>
    {children}
  </Box>
);

const Table = ({ children, size = 'medium', ...props }) => (
  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', ...props }}>
    {children}
  </Box>
);

const TableHead = ({ children, sx = {} }) => (
  <Box component="thead" sx={{ ...sx }}>{children}</Box>
);

const TableBody = ({ children }) => (
  <Box component="tbody">{children}</Box>
);

const TableRow = ({ children, hover = false, sx = {} }) => (
  <Box 
    component="tr" 
    sx={{ 
      '&:hover': hover ? { bgcolor: '#F9FAFB' } : {},
      ...sx 
    }}
  >
    {children}
  </Box>
);

const TableCell = ({ children, align = 'left', sx = {}, ...props }) => (
  <Box 
    component="td" 
    sx={{ 
      px: 1.5, 
      py: 1, 
      fontSize: '0.75rem',
      borderBottom: '1px solid #ECECEC',
      textAlign: align,
      ...sx 
    }}
    {...props}
  >
    {children}
  </Box>
);

// ============================================================
// GRID COMPONENTS (if not available in your project)
// ============================================================

const Grid = ({ container = false, item = false, children, spacing = 0, sx = {}, xs, sm, md, ...props }) => {
  if (container) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: spacing ? `-${spacing / 2}px` : 0, ...sx }} {...props}>
        {children}
      </Box>
    );
  }
  
  const width = xs ? (xs / 12 * 100) : sm ? (sm / 12 * 100) : md ? (md / 12 * 100) : 100;
  
  return (
    <Box sx={{ width: `${width}%`, padding: spacing ? `${spacing / 2}px` : 0, ...sx }} {...props}>
      {children}
    </Box>
  );
};

export default ReportViewer;
