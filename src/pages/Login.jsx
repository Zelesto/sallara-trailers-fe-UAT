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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Form submitted with credentials:', credentials);

    try {
      const { token, user, success } = await login(credentials);
      console.log('Login response:', { token, user, success });

      if (!token) {
        throw new Error('No token returned from backend');
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.log('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    console.log('Input changed:', e.target.name, e.target.value);

    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container
  component="main"
  maxWidth={false}
  sx={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 2,
  }}
>
  <Paper
    elevation={3}
    sx={{
      width: '100%',
      maxWidth: 500,
      p: { xs: 3, sm: 4, md: 5 },
      borderRadius: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
          {/* Larger Logo Container */}
          <Box
            sx={{
              width: 120, // Increased from 48
              height: 120, // Increased from 48
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.50',
              borderRadius: 2,
              p: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              component="img"
              src={SCBTrailersLogo}
              alt="PGSA Trailers Logo"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                // Fallback text if image fails to load
                const parent = e.target.parentElement;
                parent.innerHTML = `
                  <div style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 32px;
                  ">PGSA</div>
                `;
              }}
            />
          </Box>

          <Typography 
            component="h1" 
            variant="h5" 
            align="center" 
            gutterBottom
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Fleet Management System
          </Typography>

          <Typography
            variant="caption"
            align="center"
            color="textSecondary"
            sx={{ 
              display: 'block', 
              mb: 1,
              fontSize: '0.75rem',
            }}
          >
            PGSA Trailers
          </Typography>

          <Typography
            variant="caption"
            align="center"
            color="textSecondary"
            sx={{ 
              display: 'block', 
              mb: 3,
              fontSize: '0.7rem',
            }}
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
              sx={{ mb: 2, width: '100%' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ 
            mt: 3, 
            textAlign: 'center',
            width: '100%',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Don't have an account?
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              Contact Management
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              www.phoenixgroupsa.co.za
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              IT-info@phoenixgroupsa.co.za
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
