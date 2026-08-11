// src/styles/formStyles.js
import Mui, { MuiCore, MuiIcons, MuiLab, MuiX, MuiStyled, MuiColors } from './muiImports';

const {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Autocomplete
} = MuiCore;

const {
  SaveIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  AddIcon,
  RefreshIcon,
  SearchIcon,
  AssignmentIcon,
  ScheduleIcon,
  DirectionsCarIcon,
  DescriptionIcon,
  LocationOnIcon,
  SwapHorizIcon,
  ScaleIcon,
  AttachMoneyIcon,
  CommentIcon,
  TollIcon,
  ReceiptIcon,
  BusinessIcon,
  WarehouseIcon,
  RouteIcon
} = MuiIcons;

const { LoadingButton, LocalizationProvider, DateTimePicker, DatePicker, TimePicker } = MuiLab;
const { DataGrid, AdapterDayjs } = MuiX;
const { styled, alpha } = MuiStyled;
const { colors } = MuiColors;

// ============================================================
// FORM STYLES - Using centralized imports
// ============================================================

export const formStyles = {
  // Card styles
  card: {
    variant: 'outlined',
    sx: { mb: 1.5 }
  },
  
  cardContent: {
    sx: { p: 1.5, '&:last-child': { pb: 1.5 } }
  },
  
  cardHeader: {
    sx: { 
      p: 1.5, 
      pb: 0,
      '& .MuiCardHeader-title': { 
        fontSize: '0.9rem', 
        fontWeight: 600 
      }
    }
  },
  
  // Section styles
  sectionHeader: {
    direction: 'row',
    alignItems: 'center',
    spacing: 0.75,
    mb: 1.5,
    sx: {
      '& .MuiSvgIcon-root': {
        fontSize: '1rem'
      }
    }
  },
  
  // Form control styles
  formControl: {
    fullWidth: true,
    size: 'small',
    sx: {
      '& .MuiInputLabel-root': {
        fontSize: '0.75rem'
      },
      '& .MuiSelect-select': {
        fontSize: '0.75rem'
      }
    }
  },
  
  textField: {
    fullWidth: true,
    size: 'small',
    sx: {
      '& .MuiInputLabel-root': {
        fontSize: '0.75rem'
      },
      '& .MuiInputBase-root': {
        fontSize: '0.8rem'
      }
    }
  },
  
  select: {
    fullWidth: true,
    size: 'small',
    sx: {
      fontSize: '0.75rem',
      '& .MuiSelect-select': {
        fontSize: '0.75rem'
      }
    }
  },
  
  menuItem: {
    sx: { fontSize: '0.75rem' }
  },
  
  // Grid styles
  gridContainer: {
    spacing: 1.5
  },
  
  // Icon styles
  icon: {
    fontSize: '1rem'
  },
  
  // Helper text styles
  helperText: {
    fontSize: '0.65rem'
  },
  
  errorHelper: {
    fontSize: '0.65rem',
    color: 'error.main'
  },
  
  // Button styles
  button: {
    size: 'small',
    sx: { fontSize: '0.8rem' }
  },
  
  primaryButton: {
    variant: 'contained',
    size: 'small',
    sx: { fontSize: '0.8rem' }
  },
  
  secondaryButton: {
    variant: 'outlined',
    size: 'small',
    sx: { fontSize: '0.8rem' }
  },
  
  // Dialog styles
  dialogTitle: {
    sx: { 
      borderBottom: 1, 
      borderColor: 'divider', 
      py: 1.5, 
      px: 2,
      fontSize: '1rem',
      fontWeight: 600
    }
  },
  
  dialogContent: {
    sx: { 
      overflowY: 'auto', 
      p: 2 
    }
  },
  
  dialogActions: {
    sx: { 
      borderTop: 1, 
      borderColor: 'divider', 
      p: 1.5 
    }
  },
  
  // Chip styles
  chip: {
    size: 'small',
    sx: { 
      height: 20, 
      fontSize: '0.6rem' 
    }
  },
  
  // Alert styles
  alert: {
    sx: { 
      mb: 2, 
      fontSize: '0.8rem' 
    }
  },
  
  successAlert: {
    severity: 'success',
    sx: { 
      mb: 2, 
      fontSize: '0.8rem' 
    }
  },
  
  errorAlert: {
    severity: 'error',
    sx: { 
      mb: 2, 
      fontSize: '0.8rem' 
    }
  },
  
  // Loading styles
  loadingBox: {
    display: 'flex',
    justifyContent: 'center',
    p: 3
  },
  
  // Label styles
  label: {
    fontSize: '0.75rem'
  }
};

// ============================================================
// PAGE STYLES
// ============================================================

export const pageStyles = {
  container: {
    p: 3,
    maxWidth: 'xl',
    mx: 'auto'
  },
  
  header: {
    mb: 3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2
  },
  
  title: {
    variant: 'h5',
    fontWeight: 600,
    sx: { fontSize: '1.5rem' }
  },
  
  toolbar: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap'
  },
  
  tableContainer: {
    sx: { 
      mt: 2,
      '& .MuiTableHead-root': {
        backgroundColor: 'grey.50'
      }
    }
  },
  
  pagination: {
    sx: { 
      mt: 2,
      display: 'flex',
      justifyContent: 'flex-end'
    }
  },
  
  loadingBox: {
    display: 'flex',
    justifyContent: 'center',
    p: 3
  },
  
  errorAlert: {
    severity: 'error',
    sx: { mb: 2, fontSize: '0.8rem' }
  },
  
  successAlert: {
    severity: 'success',
    sx: { mb: 2, fontSize: '0.8rem' }
  },
  
  // Filter bar styles
  filterBar: {
    sx: { 
      mt: 2, 
      display: 'flex', 
      gap: 2, 
      flexWrap: 'wrap' 
    }
  },
  
  filterTextField: {
    label: 'Search',
    variant: 'outlined',
    size: 'small',
    sx: { flexGrow: 1, minWidth: 200 }
  },
  
  filterSelect: {
    size: 'small',
    sx: { minWidth: 150 }
  },
  
  // Tab styles
  tabs: {
    sx: { borderBottom: 1, borderColor: 'divider' }
  },
  
  tab: {
    sx: { fontSize: '0.8rem' }
  },
  
  // Card styles
  pageCard: {
    sx: { mt: 2 }
  },
  
  pageCardContent: {
    sx: { p: 2 }
  }
};

// ============================================================
// TABLE STYLES
// ============================================================

export const tableStyles = {
  container: {
    component: Paper,
    sx: { 
      '& .MuiTableHead-root': {
        backgroundColor: 'grey.50'
      }
    }
  },
  
  headCell: {
    sx: { 
      fontWeight: 600,
      fontSize: '0.75rem'
    }
  },
  
  bodyCell: {
    sx: { fontSize: '0.8rem' }
  },
  
  row: {
    hover: true,
    sx: { '&:hover': { backgroundColor: 'grey.50' } }
  },
  
  actionsCell: {
    sx: { 
      '& .MuiIconButton-root': {
        padding: 0.5
      }
    }
  },
  
  statusChip: {
    size: 'small',
    sx: { fontSize: '0.65rem' }
  },
  
  emptyState: {
    colSpan: 999,
    align: 'center',
    sx: { py: 3 }
  },
  
  emptyText: {
    variant: 'body2',
    color: 'text.secondary'
  }
};

// ============================================================
// DIALOG STYLES
// ============================================================

export const dialogStyles = {
  paper: {
    sx: { maxHeight: '90vh' }
  },
  
  title: {
    sx: { 
      borderBottom: 1, 
      borderColor: 'divider', 
      py: 1.5, 
      px: 2 
    }
  },
  
  titleText: {
    variant: 'h6',
    sx: { fontSize: '1rem', fontWeight: 600 }
  },
  
  content: {
    sx: { 
      overflowY: 'auto', 
      p: 2 
    }
  },
  
  actions: {
    sx: { 
      borderTop: 1, 
      borderColor: 'divider', 
      p: 1.5 
    }
  }
};

// ============================================================
// EXPORT ALL STYLES
// ============================================================

export default {
  formStyles,
  pageStyles,
  tableStyles,
  dialogStyles
};
