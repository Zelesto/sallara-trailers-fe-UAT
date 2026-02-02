// src/pages/PodForm.jsx
import React from 'react';
import { Box, Typography, Button, Stack, Card } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PodForm = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/pods')}
          sx={{ mr: 2 }}
        >
          Back to PODs
        </Button>
        <Typography variant="h4" component="h1">
          Create POD
        </Typography>
      </Stack>
      <Card>
        <Box p={3}>
          <Typography>POD form will be displayed here</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default PodForm;