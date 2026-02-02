// src/pages/TripAnalytics.jsx
import React from 'react';
import { Box, Typography, Card } from '@mui/material';

const TripAnalytics = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Trip Analytics
      </Typography>
      <Card>
        <Box p={3}>
          <Typography>Trip analytics will be displayed here</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default TripAnalytics;