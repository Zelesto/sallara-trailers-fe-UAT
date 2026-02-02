import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Close, Edit, Delete } from '@mui/icons-material';

const FormContainer = ({
  title,
  open,
  onClose,
  children,
  onSave,
  onDelete,
  loading = false,
  deleteLabel = 'Delete',
  saveLabel = 'Save',
  maxWidth = 'md',
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            disabled={loading}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {children}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {onDelete && (
          <Button
            onClick={onDelete}
            color="error"
            variant="outlined"
            disabled={loading}
            startIcon={<Delete />}
          >
            {deleteLabel}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Edit />}
        >
          {saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormContainer;