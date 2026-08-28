// src/pages/TripReports.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LocalShipping as LoadIcon,
  LocalGasStation as FuelIcon,
  People as DriverIcon,
  DirectionsCar as VehicleIcon,
  Assessment as ReportIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import ReportViewer from '../components/ReportViewer';
import { reportService } from '../services/reportService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';

// ============================================================
// REPORT TYPES CONFIGURATION
// ============================================================

const REPORT_TYPES = [
  {
    id: 'trip',
    name: 'Trip Report',
    icon: RouteIcon,
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    description: 'Full trip details including driver, vehicle, fuel, and route information',
    fields: [
      { 
        id: 'tripNumber', 
        label: 'Trip Number', 
        type: 'text', 
        placeholder: 'Enter trip number (e.g., TRP-2026-001)',
        required: true,
      }
    ],
  },
  {
    id: 'load',
    name: 'Load Report',
    icon: LoadIcon,
    color: '#059669',
    bgColor: '#D1FAE5',
    description: 'Complete load details including all trips, cargo, and distance calculations',
    fields: [
      { 
        id: 'loadNumber', 
        label: 'Load Number', 
        type: 'text', 
        placeholder: 'Enter load number (e.g., LOAD-2026-001)',
        required: true,
      }
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel Report',
    icon: FuelIcon,
    color: '#D97706',
    bgColor: '#FEF3C7',
    description: 'Fuel consumption, efficiency, and cost analysis by vehicle or date range',
    fields: [
      { 
        id: 'vehicleId', 
        label: 'Vehicle', 
        type: 'select',
        placeholder: 'Select vehicle',
        required: false,
      },
      { 
        id: 'dateRange', 
        label: 'Date Range', 
        type: 'daterange',
        required: false,
      },
    ],
  },
  {
    id: 'driver',
    name: 'Driver Report',
    icon: DriverIcon,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    description: 'Driver performance, trip history, and efficiency metrics',
    fields: [
      { 
        id: 'driverId', 
        label: 'Driver', 
        type: 'select',
        placeholder: 'Select driver',
        required: true,
      },
      { 
        id: 'dateRange', 
        label: 'Date Range', 
        type: 'daterange',
        required: false,
      },
    ],
  },
  {
    id: 'vehicle',
    name: 'Vehicle Report',
    icon: VehicleIcon,
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: 'Vehicle performance, maintenance, and trip history',
    fields: [
      { 
        id: 'vehicleId', 
        label: 'Vehicle', 
        type: 'select',
        placeholder: 'Select vehicle',
        required: true,
      },
      { 
        id: 'dateRange', 
        label: 'Date Range', 
        type: 'daterange',
        required: false,
      },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Report',
    icon: ReportIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Build a custom report with your own filters and parameters',
    fields: [
      { 
        id: 'dateRange', 
        label: 'Date Range', 
        type: 'daterange',
        required: false,
      },
      { 
        id: 'status', 
        label: 'Status', 
        type: 'select',
        placeholder: 'Filter by status',
        required: false,
      },
      { 
        id: 'search', 
        label: 'Search', 
        type: 'text',
        placeholder: 'Search trips...',
        required: false,
      },
    ],
  },
];

// ============================================================
// REPORT CARD COMPONENT
// ============================================================
const ReportCard = ({ report, onSelect, isSelected }) => {
  const Icon = report.icon;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        border: isSelected ? `2px solid ${report.color}` : '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderColor: report.color,
        },
      }}
    >
      <CardActionArea 
        onClick={() => onSelect(report.id)}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.5} alignItems="center" textAlign="center">
            <Box
              sx={{
                bgcolor: report.bgColor,
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: '2rem', color: report.color }} />
            </Box>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
              {report.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {report.description}
            </Typography>
            {isSelected && (
              <Chip
                label="Selected"
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: report.bgColor,
                  color: report.color,
                  fontWeight: 600,
                  fontSize: '0.6rem',
                }}
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

// ============================================================
// PARAMETER INPUT COMPONENT
// ============================================================
const ParameterInput = ({ field, value, onChange, options = [] }) => {
  switch (field.type) {
    case 'select':
      return (
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: '0.75rem' }}>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            label={field.label}
            sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
              Select {field.label}
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.id || opt.value} value={opt.id || opt.value} sx={{ fontSize: '0.75rem' }}>
                {opt.label || opt.name || opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case 'daterange':
      return (
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="From"
            value={value?.from || ''}
            onChange={(e) => onChange(field.id, { ...value, from: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
          />
          <TextField
            fullWidth
            size="small"
            type="date"
            label="To"
            value={value?.to || ''}
            onChange={(e) => onChange(field.id, { ...value, to: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
          />
        </Stack>
      );

    default:
      return (
        <TextField
          fullWidth
          size="small"
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => {
            const newValue = field.id === 'tripNumber' || field.id === 'loadNumber' 
              ? e.target.value.toUpperCase() 
              : e.target.value;
            onChange(field.id, newValue);
          }}
          required={field.required}
          sx={{ 
            '& .MuiInputLabel-root': { fontSize: '0.75rem' },
            '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: '10px' },
          }}
          InputProps={{
            startAdornment: field.type === 'text' && (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
              </InputAdornment>
            ),
            endAdornment: value && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => onChange(field.id, '')}
                >
                  <ClearIcon sx={{ fontSize: '0.7rem' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      );
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const TripReports = () => {
  // ✅ Report Viewer state
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [reportViewerData, setReportViewerData] = useState(null);
  const [reportViewerType, setReportViewerType] = useState('trip');
  const [reportViewerTitle, setReportViewerTitle] = useState('');
  const [reportViewerLoading, setReportViewerLoading] = useState(false);
  const [reportViewerError, setReportViewerError] = useState(null);
  
  // ✅ Report selection state
  const [selectedReport, setSelectedReport] = useState(null);
  const [parameters, setParameters] = useState({});
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ Dropdown options
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const selectedReportConfig = REPORT_TYPES.find(r => r.id === selectedReport);
  const isReportValid = selectedReportConfig?.fields.every(f => 
    !f.required || (parameters[f.id] && parameters[f.id] !== '')
  );

  // Load options for select fields
  useEffect(() => {
    if (selectedReport) {
      loadOptions(selectedReport);
    }
  }, [selectedReport]);

  const loadOptions = async (reportType) => {
    setLoadingOptions(true);
    try {
      if (reportType === 'fuel' || reportType === 'vehicle' || reportType === 'custom') {
        const response = await vehicleService.getAllVehicles();
        setVehicles(response || []);
      }
      if (reportType === 'driver' || reportType === 'custom') {
        const response = await driverService.getAllDrivers();
        setDrivers(response || []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const getOptionsForField = (fieldId) => {
    if (fieldId === 'vehicleId') {
      return vehicles.map(v => ({
        id: v.id,
        label: v.registrationNumber || `${v.make} ${v.model}`
      }));
    }
    if (fieldId === 'driverId') {
      return drivers.map(d => ({
        id: d.id,
        label: d.name || `${d.firstName} ${d.lastName}`
      }));
    }
    if (fieldId === 'status') {
      return ['PLANNED', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'FINALIZED', 'CANCELLED'];
    }
    return [];
  };

  const filteredReports = REPORT_TYPES.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // REPORT GENERATION
  // ============================================================

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      setError('Please select a report type');
      return;
    }

    // Validate required fields
    const missingField = selectedReportConfig?.fields.find(f => f.required && !parameters[f.id]);
    if (missingField) {
      setError(`Please enter ${missingField.label}`);
      return;
    }

    setReportViewerLoading(true);
    setReportViewerError(null);
    setError(null);

    try {
      // Prepare parameters
      const params = { ...parameters };
      
      // Handle date range
      if (params.dateRange) {
        params.startDate = params.dateRange.from || null;
        params.endDate = params.dateRange.to || null;
        delete params.dateRange;
      }

      let htmlContent = null;
      let reportTitle = '';
      let reportType = selectedReport;

      console.log('🔄 Generating report with params:', params);

      // Call the appropriate report service
      switch (selectedReport) {
        case 'trip':
          if (!params.tripNumber) {
            setError('Please enter a trip number');
            setReportViewerLoading(false);
            return;
          }
          reportTitle = `Trip Report: ${params.tripNumber}`;
          htmlContent = await reportService.generateTripReport(params.tripNumber);
          break;

        case 'load':
          if (!params.loadNumber) {
            setError('Please enter a load number');
            setReportViewerLoading(false);
            return;
          }
          reportTitle = `Load Report: ${params.loadNumber}`;
          htmlContent = await reportService.generateLoadReport(params.loadNumber);
          break;

        case 'fuel':
          reportTitle = 'Fuel Consumption Report';
          const vehicleId = params.vehicleId || null;
          const startDate = params.startDate || null;
          const endDate = params.endDate || null;
          
          console.log('📊 Fuel report params:', { vehicleId, startDate, endDate });
          htmlContent = await reportService.generateFuelReport(vehicleId, startDate, endDate);
          break;

        default:
          setError(`Report type "${selectedReport}" is not fully implemented yet`);
          setReportViewerLoading(false);
          return;
      }

      console.log('📥 Received HTML content length:', htmlContent?.length);

      // ✅ Check if we got valid HTML content
      if (!htmlContent || typeof htmlContent !== 'string') {
        setReportViewerError('Failed to generate report: No content received');
        setReportViewerLoading(false);
        return;
      }

      // ✅ Validate it's HTML
      if (htmlContent.trim().startsWith('<')) {
        console.log('✅ Valid HTML content received');
        setReportViewerData(htmlContent);
        setReportViewerType(selectedReport);
        setReportViewerTitle(reportTitle);
        setShowReportViewer(true);
        setReportViewerLoading(false);
      } else {
        console.error('❌ Content is not HTML:', htmlContent.substring(0, 200));
        setReportViewerError('Generated content is not valid HTML. Please try again.');
        setReportViewerLoading(false);
      }

    } catch (err) {
      console.error('❌ Error generating report:', err);
      
      // ✅ Check if error contains HTML content we can show
      if (err.message && err.message.includes('<!DOCTYPE')) {
        setReportViewerData(err.message);
        setReportViewerType(selectedReport);
        setReportViewerTitle(`Report (Error)`);
        setReportViewerError('Report generated with warnings');
        setShowReportViewer(true);
      } else {
        setReportViewerError(err.message || 'Failed to generate report. Please try again.');
      }
      setReportViewerLoading(false);
    }
  };

  const handleParameterChange = (fieldId, value) => {
    setParameters(prev => ({ ...prev, [fieldId]: value }));
    setError(null);
    setReportViewerError(null);
  };

  const handleClearParameters = () => {
    setParameters({});
    setError(null);
    setReportViewerError(null);
  };

  const handleSelectReport = (reportId) => {
    if (selectedReport === reportId) {
      setSelectedReport(null);
      setParameters({});
    } else {
      setSelectedReport(reportId);
      setParameters({});
    }
    setError(null);
    setReportViewerError(null);
  };

  const handleCloseViewer = () => {
    setShowReportViewer(false);
    setReportViewerData(null);
    setReportViewerError(null);
  };

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }
    }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 2, sm: 2.5 }}
          spacing={{ xs: 1, sm: 0 }}
        >
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
              Report Center
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
              Generate and view detailed reports for trips, loads, fuel, drivers, and vehicles
            </Typography>
          </Box>
        </Stack>

        {/* SEARCH FILTER */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 2.5 },
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF'
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search report types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* ============================================================
            REPORT VIEWER
            ============================================================ */}
        <ReportViewer
          open={showReportViewer}
          onClose={handleCloseViewer}
          reportType={reportViewerType}
          title={reportViewerTitle}
          htmlContent={reportViewerData}
          loading={reportViewerLoading}
          error={reportViewerError}
        />
        
        {/* ERROR DISPLAY */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: '12px' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* REPORT TYPES GRID */}
        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
          Available Reports
        </Typography>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {filteredReports.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  No report types match your search
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredReports.map((report) => (
              <Grid key={report.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ReportCard
                  report={report}
                  isSelected={selectedReport === report.id}
                  onSelect={handleSelectReport}
                />
              </Grid>
            ))
          )}
        </Grid>

        {/* PARAMETERS PANEL */}
        {selectedReport && selectedReportConfig && (
          <Paper
            elevation={0}
            sx={{
              mt: { xs: 2, sm: 2.5 },
              p: { xs: 2, sm: 2.5 },
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    bgcolor: selectedReportConfig.bgColor,
                    borderRadius: '8px',
                    p: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <selectedReportConfig.icon sx={{ fontSize: '1.2rem', color: selectedReportConfig.color }} />
                </Box>
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                  {selectedReportConfig.name} Parameters
                </Typography>
                <Chip
                  label={selectedReportConfig.fields.filter(f => f.required).length > 0 ? 'Required fields' : 'Optional'}
                  size="small"
                  sx={{ 
                    fontSize: '0.55rem', 
                    height: 20,
                    bgcolor: '#F3F4F6',
                    color: '#6B7280',
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearParameters}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: '10px' }}
                >
                  Clear All
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleGenerateReport}
                  disabled={reportViewerLoading || !isReportValid}
                  sx={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'none', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' }
                  }}
                >
                  {reportViewerLoading ? <CircularProgress size={16} /> : 'Generate Report'}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {selectedReportConfig.fields.map((field) => (
                <Grid key={field.id} size={{ xs: 12, sm: field.type === 'daterange' ? 12 : 6, md: field.type === 'daterange' ? 12 : 4 }}>
                  <ParameterInput
                    field={field}
                    value={parameters[field.id]}
                    onChange={handleParameterChange}
                    options={getOptionsForField(field.id)}
                  />
                  {field.required && !parameters[field.id] && (
                    <Typography variant="caption" color="error" sx={{ fontSize: '0.6rem', mt: 0.5, display: 'block' }}>
                      * Required
                    </Typography>
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

      </Box>
    </Box>
  );
};

export default TripReports;
