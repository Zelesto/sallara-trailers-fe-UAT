// src/components/inventory/StockStatusBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';
import { CheckCircle, Warning, Cancel } from '@mui/icons-material';

const StockStatusBadge = ({ quantity, minLevel }) => {
  let status = 'In Stock';
  let color = 'success';
  let icon = <CheckCircle sx={{ fontSize: '0.7rem' }} />;

  if (quantity <= 0) {
    status = 'Out of Stock';
    color = 'error';
    icon = <Cancel sx={{ fontSize: '0.7rem' }} />;
  } else if (quantity <= minLevel) {
    status = 'Low Stock';
    color = 'warning';
    icon = <Warning sx={{ fontSize: '0.7rem' }} />;
  }

  return (
    <Chip
      label={`${status}: ${quantity}`}
      color={color}
      size="small"
      icon={icon}
      sx={{ height: 20, fontSize: '0.6rem' }}
    />
  );
};

export default StockStatusBadge;
