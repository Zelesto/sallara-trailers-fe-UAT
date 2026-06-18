import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
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
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 4,
          p: {
            xs: 3,
            sm: 4,
            md: 5,
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={SCBTrailersLogo}
            alt="PGSA Trailers Logo"
            sx={{
              width: {
                xs: 240,
                sm: 320,
                md: 380,
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
              xs: '1.5rem',
              sm: '1.75rem',
              md: '2rem',
            },
            fontWeight: 700,
            textAlign: 'center',
            mb: 1,
          }}
        >
          Fleet Management System
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            mb: 0.5,
            fontWeight: 500,
          }}
        >
          Sallara Trailers
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mb: 3,
          }}
        >
          Version 1.0.1
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Sign in to your account
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              width: '100%',
              mb: 3,
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
            maxWidth: 400,
          }}
        >
          <TextField
            margin="normal"
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
          />

          <TextField
            margin="normal"
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
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Box
          sx={{
            mt: 3,
            pt: 3,
            width: '100%',
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            Don't have an account?
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            Contact Management
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            www.sallara.co.za
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            IT@sallara.co.za
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
