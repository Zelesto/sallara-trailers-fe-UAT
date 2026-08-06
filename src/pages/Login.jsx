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
  IconButton,
  InputAdornment,
  Fade,
  Grow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Email,
  Lock,
  Business,
  Phone,
} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Container
      component="main"
      maxWidth={false}
      disableGutters
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7F7FC 0%, #E8ECF1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Grow in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 480,
            borderRadius: { xs: 3, sm: 4 },
            border: '1px solid #ECECEC',
            p: { xs: 3, sm: 4, md: 4.5 },
            bgcolor: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 48px rgba(0,0,0,0.06)',
            },
          }}
        >
          {/* Decorative top bar */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)',
            }}
          />

          {/* Logo */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 2, sm: 2.5 },
              pt: 0.5,
            }}
          >
            <Box
              component="img"
              src={SCBTrailersLogo}
              alt="PGSA Trailers Logo"
              sx={{
                width: { xs: 140, sm: 180, md: 200 },
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Box>

          {/* Title Section */}
          <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 2.5 } }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
              }}
            >
              Fleet Management System
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#4F46E5',
                fontWeight: 600,
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                mt: 0.25,
                letterSpacing: '0.5px',
              }}
            >
              SALLARA TRAILERS
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#6B7280',
                fontSize: { xs: '0.55rem', sm: '0.6rem' },
                mt: 0.25,
              }}
            >
              v1.2.1 • 15 AUG 2026
            </Typography>
          </Box>

          <Divider sx={{ mb: { xs: 2, sm: 2.5 } }} />

          {/* Welcome Message */}
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              textAlign: 'center',
              mb: { xs: 2, sm: 2.5 },
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
            }}
          >
            Welcome back! Please sign in to continue.
          </Typography>

          {/* Error Alert */}
          {error && (
            <Fade in timeout={300}>
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  bgcolor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  '& .MuiAlert-icon': { color: '#EF4444' },
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={handleChange}
              disabled={loading}
              size="medium"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '0.8rem',
                  color: focusedField === 'email' ? '#4F46E5' : '#6B7280',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#F9FAFB',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#F3F4F6',
                  },
                  '& fieldset': {
                    borderColor: focusedField === 'email' ? '#4F46E5' : '#ECECEC',
                    borderWidth: focusedField === 'email' ? 2 : 1,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4F46E5',
                    borderWidth: 2,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    py: 1.2,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ fontSize: '1rem', color: '#6B7280' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              disabled={loading}
              size="medium"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              sx={{
                mt: 1.5,
                '& .MuiInputLabel-root': {
                  fontSize: '0.8rem',
                  color: focusedField === 'password' ? '#4F46E5' : '#6B7280',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#F9FAFB',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#F3F4F6',
                  },
                  '& fieldset': {
                    borderColor: focusedField === 'password' ? '#4F46E5' : '#ECECEC',
                    borderWidth: focusedField === 'password' ? 2 : 1,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4F46E5',
                    borderWidth: 2,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    py: 1.2,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: '1rem', color: '#6B7280' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      size="small"
                      sx={{ color: '#6B7280' }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: '1rem' }} /> : <Visibility sx={{ fontSize: '1rem' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                py: { xs: 1.2, sm: 1.4 },
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                  boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  background: '#9CA3AF',
                  boxShadow: 'none',
                },
              }}
              startIcon={!loading && <LoginIcon sx={{ fontSize: '1.1rem' }} />}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing In...</span>
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              mt: { xs: 2.5, sm: 3 },
              pt: { xs: 2, sm: 2.5 },
              width: '100%',
              borderTop: '1px solid #ECECEC',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#6B7280',
                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                fontWeight: 500,
              }}
            >
              Don't have an account?
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#9CA3AF',
                fontSize: { xs: '0.55rem', sm: '0.6rem' },
                mt: 0.5,
              }}
            >
              Contact Management • www.sallara.co.za
            </Typography>

            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{ mt: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Business sx={{ fontSize: '0.7rem', color: '#9CA3AF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#9CA3AF' }}>
                  IT@sallara.co.za
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: '0.7rem', color: '#9CA3AF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#9CA3AF' }}>
                  +27 11 123 4567
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Grow>
    </Container>
  );
};

export default Login;
