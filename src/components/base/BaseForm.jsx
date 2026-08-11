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
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import { formStyles, dialogStyles } from '../../styles/formStyles';

/**
 * BaseForm - A reusable form component that provides common form functionality
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Called when form should close
 * @param {Function} props.onSubmit - Called when form is submitted
 * @param {Function} props.onCancel - Called when form is cancelled (optional)
 * @param {string} props.title - Form title
 * @param {string} props.mode - 'create' or 'edit'
 * @param {Object} props.initialData - Initial data for edit mode
 * @param {Function} props.onSuccess - Called after successful submission
 * @param {Function} props.validate - Validation function
 * @param {Array} props.sections - Form sections configuration
 * @param {boolean} props.loading - Loading state
 * @param {string} props.submitLabel - Custom submit button label
 * @param {string} props.cancelLabel - Custom cancel button label
 * @param {boolean} props.fullWidth - Full width dialog
 * @param {string} props.maxWidth - Dialog max width ('xs'|'sm'|'md'|'lg'|'xl')
 * @param {React.ReactNode} props.actions - Custom action buttons
 * @param {React.ReactNode} props.headerContent - Custom header content
 * @param {React.ReactNode} props.footerContent - Custom footer content
 * @param {Object} props.formProps - Additional form props
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
        sections.forEach(section => {
          section.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultData[field.name] = field.defaultValue;
            } else if (field.type === 'checkbox') {
              defaultData[field.name] = false;
            } else {
              defaultData[field.name] = '';
            }
          });
        });
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

  // Handle nested field change
  const handleNestedFieldChange = (parent, name, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [name]: value
      }
    }));
    if (errors[`${parent}.${name}`]) {
      setErrors(prev => ({ ...prev, [`${parent}.${name}`]: '' }));
    }
  };

  // Validate form
  const validateForm = useCallback(() => {
    if (!validate) {
      // Default validation - check required fields
      const newErrors = {};
      sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.required && !formData[field.name]) {
            newErrors[field.name] = `${field.label || field.name} is required`;
          }
        });
      });
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

    const value = formData[name] || '';
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
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              {...fieldProps}
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => handleFieldChange(name, newValue)}
              disabled={disabled || isSubmitting || loading}
              slotProps={{
                textField: {
                  ...commonProps,
                  variant: 'outlined',
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'datetime':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              {...fieldProps}
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => handleFieldChange(name, newValue)}
              disabled={disabled || isSubmitting || loading}
              slotProps={{
                textField: {
                  ...commonProps,
                  variant: 'outlined',
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
    return sections.map((section, sectionIndex) => (
      <Box key={sectionIndex} sx={{ mb: 3 }}>
        {section.title && (
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
            {section.title}
          </Typography>
        )}
        <Grid container spacing={section.spacing || 1.5}>
          {section.fields.map((field, fieldIndex) => {
            const fieldSize = field.size || 6;
            return (
              <Grid item xs={12} md={fieldSize} key={`${field.name}-${fieldIndex}`}>
                {renderField(field, sectionIndex, fieldIndex)}
              </Grid>
            );
          })}
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

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{ sx: { maxHeight: '90vh' } }}
      {...props}
    >
      <DialogTitle sx={dialogStyles.title.sx}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={dialogStyles.titleText.sx}>
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

      <DialogContent dividers sx={dialogStyles.content.sx}>
        {error && (
          <Alert severity="error" sx={formStyles.alert.sx} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={formStyles.alert.sx} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box component="form" ref={formRef} onSubmit={handleSubmit} {...formProps}>
          {renderContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={dialogStyles.actions.sx}>
        {footerContent}
        {actions || (
          <>
            <Button
              onClick={handleCancel}
              disabled={isSubmitting || loading}
              startIcon={<CloseIcon />}
              sx={formStyles.button.sx}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || loading || isSuccess}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : <SaveIcon />}
              sx={formStyles.primaryButton.sx}
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
