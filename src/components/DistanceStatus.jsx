// src/components/DistanceStatus.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    Button,
    Chip,
    Stack,
    Alert,
    IconButton,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { Refresh, Speed } from '@mui/icons-material';
import api from '../services/api';

const DistanceStatus = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        loadPendingCount();
        const interval = setInterval(loadPendingCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadPendingCount = async () => {
        try {
            const response = await api.get('/distance/pending/count');
            setPendingCount(response.data.count || 0);
        } catch (err) {
            console.error('Failed to load pending count:', err);
        }
    };

    const handleProcessPending = async () => {
        setProcessing(true);
        setStatus('processing');
        try {
            await api.post('/distance/pending');
            setStatus('completed');
            loadPendingCount();
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err) {
            console.error('Processing failed:', err);
            setStatus('error');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = () => {
        if (pendingCount === 0) return 'success';
        if (pendingCount > 50) return 'error';
        if (pendingCount > 20) return 'warning';
        return 'info';
    };

    return (
        <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Speed sx={{ color: '#4F46E5' }} />
                    <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.85rem' }}>
                        Distance Calculation Status
                    </Typography>
                    <Chip
                        label={`${pendingCount} pending`}
                        size="small"
                        color={getStatusColor()}
                        sx={{ height: 20, fontSize: '0.55rem' }}
                    />
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Tooltip title="Check for pending calculations">
                        <IconButton size="small" onClick={loadPendingCount}>
                            <Refresh sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        size="small"
                        disabled={processing || pendingCount === 0}
                        onClick={handleProcessPending}
                        sx={{
                            fontSize: '0.7rem',
                            textTransform: 'none',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                            },
                        }}
                    >
                        {processing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                        {processing ? 'Processing...' : 'Process Pending'}
                    </Button>
                </Stack>
            </Stack>

            {status === 'processing' && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress sx={{ borderRadius: '4px', height: 6 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Processing distance calculations...
                    </Typography>
                </Box>
            )}

            {status === 'completed' && (
                <Alert severity="success" sx={{ mt: 1, fontSize: '0.75rem', borderRadius: '10px' }} onClose={() => setStatus('idle')}>
                    Distance calculations completed successfully!
                </Alert>
            )}

            {status === 'error' && (
                <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem', borderRadius: '10px' }} onClose={() => setStatus('idle')}>
                    Failed to complete distance calculations. Please try again.
                </Alert>
            )}
        </Paper>
    );
};

export default DistanceStatus;
