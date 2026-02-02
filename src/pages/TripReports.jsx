// src/pages/TripReports.jsx
import React from 'react';
import { Box, Typography, Card } from '@mui/material';

const TripReports = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Trip Reports
      </Typography>
      <Card>
        <Box p={3}>
          <Typography>Trip reports will be displayed here</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default TripReports;