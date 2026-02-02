import SCBTrailersLogo from '../components/assets/img/PGSALogo.png';
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

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Login.jsx - Add debugging
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Form submitted with credentials:', credentials); // ADD THIS LINE

    try {
      const { token, user, success } = await login(credentials);
      console.log('Login response:', { token, user, success }); // ADD THIS LINE

      if (!token) {
        throw new Error('No token returned from backend');
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.log('Login error:', err); // ADD THIS LINE
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    console.log('Input changed:', e.target.name, e.target.value); // ADD THIS

    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 6, width: '100%' }}>
          <Box
            component="img"
            src={SCBTrailersLogo}
            alt="Fleet Management System"
            sx={{
              display: 'block',
              mx: 'auto',
              mb: 2,
              width: 48,
              height: 48,
              objectFit: 'contain',
            }}
          />

          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Fleet Management System
          </Typography>

          <Typography
            variant="caption"
            align="center"
            color="textSecondary"
            sx={{ display: 'block', mb: 3 }}
          >
            v1.0.1
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Sign in to your account
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
              error={!!error}
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
              error={!!error}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account:
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Contact Management
              <br />
              www.phoenixgroupsa.co.za <br/> IT-info@phoenixgroupsa.co.za
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;