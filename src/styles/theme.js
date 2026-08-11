// src/styles/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
      dark: '#c62828',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.675rem' },
    button: { fontSize: '0.875rem', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
        },
        sizeSmall: {
          fontSize: '0.75rem',
          padding: '4px 12px',
        },
        sizeLarge: {
          fontSize: '0.9rem',
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          '&:last-child': {
            paddingBottom: 12,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem',
          },
          '& .MuiInputBase-root': {
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
        },
        select: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.65rem',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
          fontSize: '1rem',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          height: 24,
        },
        sizeSmall: {
          height: 20,
          fontSize: '0.6rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        subtitle1: {
          fontSize: '0.875rem',
        },
        subtitle2: {
          fontSize: '0.8rem',
        },
        body2: {
          fontSize: '0.75rem',
        },
        caption: {
          fontSize: '0.675rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 6,
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem',
          },
          '& .MuiInputBase-root': {
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          minHeight: 40,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          padding: '8px 12px',
        },
        head: {
          fontSize: '0.75rem',
          fontWeight: 600,
        },
      },
    },
  },
});

// Common styled components
export const formStyles = {
  card: {
    variant: 'outlined',
    sx: { mb: 1.5 },
  },
  cardContent: {
    sx: { p: 1.5, '&:last-child': { pb: 1.5 } },
  },
  sectionHeader: {
    direction: 'row',
    alignItems: 'center',
    spacing: 0.75,
    mb: 1.5,
  },
  formLabel: {
    fontSize: '0.75rem',
  },
  formControl: {
    fullWidth: true,
    size: 'small',
  },
  textField: {
    fullWidth: true,
    size: 'small',
  },
  select: {
    fullWidth: true,
    size: 'small',
    sx: { fontSize: '0.75rem' },
  },
  menuItem: {
    sx: { fontSize: '0.75rem' },
  },
  gridContainer: {
    spacing: 1.5,
  },
  icon: {
    fontSize: '1rem',
  },
  errorHelper: {
    fontSize: '0.65rem',
  },
};

export const pageStyles = {
  container: {
    p: 3,
    maxWidth: 'xl',
    mx: 'auto',
  },
  header: {
    mb: 3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  title: {
    variant: 'h5',
    fontWeight: 600,
    sx: { fontSize: '1.5rem' },
  },
  toolbar: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap',
  },
  tableContainer: {
    sx: { 
      mt: 2,
      '& .MuiTableHead-root': {
        backgroundColor: 'grey.50',
      },
    },
  },
  pagination: {
    sx: { 
      mt: 2,
      display: 'flex',
      justifyContent: 'flex-end',
    },
  },
  loadingBox: {
    display: 'flex',
    justifyContent: 'center',
    p: 3,
  },
  errorAlert: {
    sx: { mb: 2, fontSize: '0.8rem' },
  },
  successAlert: {
    sx: { mb: 2, fontSize: '0.8rem' },
  },
};
