// src/components/base/BaseForm.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Import date pickers with proper configuration
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Import styles with fallback
import { formStyles, dialogStyles } from '../../styles/formStyles';

// Fallback styles if imports fail
const safeFormStyles = formStyles || {
  alert: { sx: { mb: 2 } },
  button: { sx: {} },
  primaryButton: { sx: {} }
};

const safeDialogStyles = dialogStyles || {
  title: { sx: {} },
  titleText: { sx: {} },
  content: { sx: {} },
  actions: { sx: {} }
};

/**
 * BaseForm - A reusable form component
 */
function BaseForm({
  open = false,
  onClose,
  onSubmit,
  onCancel,
  title = 'Form',
  mode = 'create',
  initialData = null,
  onSuccess,
  validate,
  sections = [],
  loading = false,
  submitLabel,
  cancelLabel = 'Cancel',
  fullWidth = true,
  maxWidth = 'md',
  actions,
  headerContent,
  footerContent,
  formProps = {},
  children,
  ...props
}) {
  // State
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState({});

  // Refs
  const formRef = useRef(null);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Reset to default/empty state
        const defaultData = {};
        if (Array.isArray(sections)) {
          sections.forEach(section => {
            if (section.fields && Array.isArray(section.fields)) {
              section.fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                  defaultData[field.name] = field.defaultValue;
                } else if (field.type === 'checkbox') {
                  defaultData[field.name] = false;
                } else {
                  defaultData[field.name] = '';
                }
              });
            }
          });
        }
        setFormData(defaultData);
      }
      setErrors({});
      setError(null);
      setSuccess(null);
      setIsSuccess(false);
      setTouched({});
    }
  }, [open, initialData, sections]);

  // Handle field change
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    // Clear field error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = useCallback(() => {
    if (!validate) {
      // Default validation - check required fields
      const newErrors = {};
      if (Array.isArray(sections)) {
        sections.forEach(section => {
          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach(field => {
              if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label || field.name} is required`;
              }
            });
          }
        });
      }
      return newErrors;
    }
    return validate(formData);
  }, [formData, validate, sections]);

  // Handle submit
  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();
    
    if (isSubmitting) return;
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Focus on first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      const fieldElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (fieldElement) {
        fieldElement.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setIsSuccess(false);

    try {
      const result = await onSubmit(formData);
      setSuccess(result?.message || 'Operation completed successfully');
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess(result);
      }

      // Auto close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, onSuccess, onClose, validateForm, isSubmitting]);

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // Render field based on type
  const renderField = (field, sectionIndex, fieldIndex) => {
    const {
      type,
      name,
      label,
      required,
      disabled,
      helperText,
      options,
      placeholder,
      rows,
      component: CustomComponent,
      ...fieldProps
    } = field;

    const value = formData[name] ?? '';
    const error = errors[name];
    const isTouched = touched[name];

    if (CustomComponent) {
      return React.cloneElement(CustomComponent, {
        ...fieldProps,
        key: `${name}-${sectionIndex}-${fieldIndex}`,
        value,
        onChange: (val) => handleFieldChange(name, val),
        error: !!error,
        helperText: error || helperText,
        required,
        disabled: disabled || isSubmitting || loading,
        label,
        placeholder,
      });
    }

    // Common props for all fields
    const commonProps = {
      key: `${name}-${sectionIndex}-${fieldIndex}`,
      fullWidth: true,
      size: 'small',
      value,
      onChange: (e) => handleFieldChange(name, e.target.value),
      error: !!error,
      helperText: error || helperText,
      required,
      disabled: disabled || isSubmitting || loading,
      label,
      placeholder,
    };

    switch (type) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            {...fieldProps}
            type="text"
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            {...fieldProps}
            type="number"
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            {...fieldProps}
            multiline
            rows={rows || 3}
          />
        );

      case 'select':
        return (
          <FormControl
            fullWidth
            size="small"
            required={required}
            error={!!error}
            disabled={disabled || isSubmitting || loading}
          >
            <InputLabel>{label}</InputLabel>
            <Select
              {...fieldProps}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              label={label}
            >
              <MenuItem value="">Select {label}</MenuItem>
              {options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </MenuItem>
              ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
            {error && <FormHelperText error>{error}</FormHelperText>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            {...fieldProps}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(name, e.target.checked)}
                disabled={disabled || isSubmitting || loading}
              />
            }
            label={label}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            {...fieldProps}
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleFieldChange(name, e.target.checked)}
                disabled={disabled || isSubmitting || loading}
              />
            }
            label={label}
          />
        );

      case 'date':
        // SAFE: Always use null if value is not a valid date
        const dateValue = value ? dayjs(value) : null;
        const isValidDate = dateValue && dateValue.isValid();
        
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              {...fieldProps}
              label={label}
              value={isValidDate ? dateValue : null}
              onChange={(newValue) => {
                // Handle both dayjs object and null safely
                const val = newValue && newValue.isValid() ? newValue.toISOString() : null;
                handleFieldChange(name, val);
              }}
              disabled={disabled || isSubmitting || loading}
              slotProps={{
                textField: {
                  ...commonProps,
                  variant: 'outlined',
                  error: !!error,
                  helperText: error || helperText || (required ? 'Required' : ''),
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'datetime':
        // SAFE: Always use null if value is not a valid date
        const datetimeValue = value ? dayjs(value) : null;
        const isValidDatetime = datetimeValue && datetimeValue.isValid();
        
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              {...fieldProps}
              label={label}
              value={isValidDatetime ? datetimeValue : null}
              onChange={(newValue) => {
                // Handle both dayjs object and null safely
                const val = newValue && newValue.isValid() ? newValue.toISOString() : null;
                handleFieldChange(name, val);
              }}
              disabled={disabled || isSubmitting || loading}
              slotProps={{
                textField: {
                  ...commonProps,
                  variant: 'outlined',
                  error: !!error,
                  helperText: error || helperText || (required ? 'Required' : ''),
                }
              }}
            />
          </LocalizationProvider>
        );

      default:
        return (
          <TextField
            {...commonProps}
            {...fieldProps}
          />
        );
    }
  };

  // Render sections
  const renderSections = () => {
    if (!Array.isArray(sections) || sections.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No form fields configured
        </Typography>
      );
    }

    return sections.map((section, sectionIndex) => (
      <Box key={sectionIndex} sx={{ mb: 3 }}>
        {section.title && (
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
            {section.title}
          </Typography>
        )}
        <Grid container spacing={section.spacing || 1.5}>
          {section.fields && Array.isArray(section.fields) ? (
            section.fields.map((field, fieldIndex) => {
              const fieldSize = field.size || 6;
              return (
                <Grid item xs={12} md={fieldSize} key={`${field.name}-${fieldIndex}`}>
                  {renderField(field, sectionIndex, fieldIndex)}
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                No fields in this section
              </Typography>
            </Grid>
          )}
        </Grid>
        {sectionIndex < sections.length - 1 && (
          <Divider sx={{ mt: 2, mb: 2 }} />
        )}
      </Box>
    ));
  };

  // Render custom content
  const renderContent = () => {
    if (children) {
      return children;
    }
    return renderSections();
  };

  // Safety check - don't render if no sections and no children
  if (!children && (!Array.isArray(sections) || sections.length === 0) && open) {
    return (
      <Dialog open={open} onClose={handleCancel} maxWidth={maxWidth} fullWidth={fullWidth}>
        <DialogTitle>
          <Typography>{title}</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            No form fields configured. Please add sections to the form.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{ sx: { maxHeight: '90vh' } }}
      {...props}
    >
      <DialogTitle sx={safeDialogStyles.title?.sx || {}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={safeDialogStyles.titleText?.sx || { fontWeight: 600 }}>
            {title}
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Typography>
          {headerContent}
          <Tooltip title="Close">
            <IconButton onClick={handleCancel} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={safeDialogStyles.content?.sx || {}}>
        {error && (
          <Alert severity="error" sx={safeFormStyles.alert?.sx || { mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={safeFormStyles.alert?.sx || { mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box component="form" ref={formRef} onSubmit={handleSubmit} {...formProps}>
          {renderContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={safeDialogStyles.actions?.sx || { p: 2 }}>
        {footerContent}
        {actions || (
          <>
            <Button
              onClick={handleCancel}
              disabled={isSubmitting || loading}
              startIcon={<CloseIcon />}
              sx={safeFormStyles.button?.sx || {}}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || loading || isSuccess}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : <SaveIcon />}
              sx={safeFormStyles.primaryButton?.sx || {}}
            >
              {isSubmitting ? 'Saving...' : isSuccess ? '✓ Saved' : submitLabel || (mode === 'create' ? 'Create' : 'Update')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default BaseForm;
