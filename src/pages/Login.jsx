import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SCBTrailersLogo from '../components/assets/img/PGSALogo.png';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await login(credentials);

      if (!token) {
        throw new Error('No token returned from backend');
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Container
      component="main"
      maxWidth={false}
      disableGutters
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 2.5,
          p: {
            xs: 2.5,
            sm: 3,
            md: 3.5,
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo - Smaller */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            component="img"
            src={SCBTrailersLogo}
            alt="PGSA Trailers Logo"
            sx={{
              width: {
                xs: 160,
                sm: 200,
                md: 240,
              },
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: {
              xs: '1.1rem',
              sm: '1.25rem',
              md: '1.4rem',
            },
            fontWeight: 700,
            textAlign: 'center',
            mb: 0.5,
          }}
        >
          Fleet Management System
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            mb: 0.25,
            fontWeight: 500,
            fontSize: '0.7rem',
          }}
        >
          Sallara Trailers
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mb: 2,
            fontSize: '0.6rem',
          }}
        >
          v1.0.1
        </Typography>

        <Divider sx={{ width: '100%', mb: 2 }} />

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ 
            mb: 2,
            fontSize: '0.8rem',
            fontWeight: 500
          }}
        >
          Sign in to continue
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              width: '100%',
              mb: 2,
              fontSize: '0.75rem',
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            maxWidth: 360,
          }}
        >
          <TextField
            margin="dense"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={credentials.email}
            onChange={handleChange}
            disabled={loading}
            size="small"
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.8rem' },
              '& .MuiInputBase-root': { fontSize: '0.85rem' },
            }}
          />

          <TextField
            margin="dense"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
            size="small"
            sx={{
              mt: 1.5,
              '& .MuiInputLabel-root': { fontSize: '0.8rem' },
              '& .MuiInputBase-root': { fontSize: '0.85rem' },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2.5,
              mb: 1.5,
              py: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 1.5,
              textTransform: 'none',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Box
          sx={{
            mt: 2,
            pt: 2,
            width: '100%',
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontSize: '0.65rem',
            }}
          >
            Don't have an account?
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontSize: '0.6rem',
              mt: 0.5,
            }}
          >
            Contact Management • www.sallara.co.za
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontSize: '0.6rem',
            }}
          >
            IT@sallara.co.za
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
