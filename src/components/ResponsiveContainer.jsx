// src/components/ResponsiveContainer.jsx
import React from 'react';
import { Box } from '@mui/material';

export const ResponsiveContainer = ({ children, maxWidth = '1600px', ...props }) => (
  <Box
    sx={{
      bgcolor: '#F7F7FC',
      minHeight: '100vh',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      width: '100%',
      overflowX: 'hidden',
      ...props.sx,
    }}
  >
    <Box
      sx={{
        maxWidth,
        margin: '0 auto',
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  </Box>
);

export default ResponsiveContainer;
