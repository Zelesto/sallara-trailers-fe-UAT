// src/pages/PodList.jsx
import React from 'react';
import { Box, Typography, Button, Stack, Card } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PodList = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Proof of Delivery
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pods/new')}
        >
          New POD
        </Button>
      </Stack>
      <Card>
        <Box p={3}>
          <Typography>POD list will be displayed here</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default PodList;