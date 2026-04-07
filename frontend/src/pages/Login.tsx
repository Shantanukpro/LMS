import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, socialLoginAuth, devSignIn } = useAuth();
  const navigate = useNavigate();

  // Ensure fields are empty on initial mount to avoid any prefilled values
  useEffect(() => {
    setUsername('');
    setPassword('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.formattedMessage || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    const mockEmail = window.prompt(`[Mock ${provider} Authentication]\nSince this is a development instance without real Client IDs, please enter a mock email to simulate the OAuth callback:`);
    if (!mockEmail) return;

    try {
      setLoading(true);
      setError('');
      await socialLoginAuth({ provider, email: mockEmail });
      navigate('/');
    } catch (err: any) {
      setError(typeof err.formattedMessage === 'string' ? err.formattedMessage : 'Social login failed.');
    } finally {
      setLoading(false);
    }
  };

  const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  return (
    <Box sx={{ minHeight: '100svh', backgroundColor: 'var(--bg-main)' }}>
      <Box sx={{
        minHeight: '100svh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', p: 3, zIndex: 10 }}>
          <Container maxWidth="xs">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                width: '100%',
                maxWidth: 380,
                mx: 'auto',
                transition: 'all 0.4s ease',
              }}
            >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Institute Logo"
              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              sx={{ height: 56, mb: 2, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
            />
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: -0.5,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              Yashwantrao Bhonsale Institute of Technology
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#14b8a6', fontWeight: 600 }} gutterBottom>
              Lab Management System
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Sign in to your account to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', '& .MuiAlert-icon': { color: '#e11d48' } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} autoComplete="off">
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="new-username"
              autoFocus
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'var(--hover-bg)',
                  color: 'var(--text-primary)',
                  '& fieldset': { borderColor: 'var(--border-color)', transition: 'all 0.2s' },
                  '&:hover fieldset': { borderColor: '#14b8a6' },
                  '&.Mui-focused fieldset': { borderColor: '#14b8a6', borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#14b8a6' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'var(--hover-bg)',
                  color: 'var(--text-primary)',
                  '& fieldset': { borderColor: 'var(--border-color)', transition: 'all 0.2s' },
                  '&:hover fieldset': { borderColor: '#14b8a6' },
                  '&.Mui-focused fieldset': { borderColor: '#14b8a6', borderWidth: '2px' },
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#14b8a6' },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2,
                borderRadius: 2,
                background: 'linear-gradient(to right, #14b8a6, #10b981)',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                boxShadow: '0 8px 20px -6px rgba(20, 184, 166, 0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(to right, #0d9488, #059669)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -8px rgba(20, 184, 166, 0.6)',
                },
                '&:disabled': {
                  background: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--border-color)' }} />
              <Typography variant="body2" sx={{ px: 2, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Or continue with
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--border-color)' }} />
            </Box>

            {/* Social Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleSocialLogin('Google')}
                startIcon={
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                }
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#14b8a6', backgroundColor: 'var(--hover-bg)' }
                }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleSocialLogin('Facebook')}
                startIcon={
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.324V1.325C24 .597 23.403 0 22.675 0z" fill="#1877F2"/>
                  </svg>
                }
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#3b82f6', backgroundColor: 'var(--hover-bg)' }
                }}
              >
                Facebook
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center', mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                sx={{ 
                  color: '#14b8a6', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8 } 
                }}
              >
                Don't have an account? Sign Up
              </Link>
              <Link
                component="button"
                variant="caption"
                onClick={() => { devSignIn(); navigate('/'); }}
                sx={{ color: 'var(--text-secondary)', transition: 'color 0.2s', '&:hover': { color: 'var(--text-primary)' } }}
              >
                Dev Sign-in
              </Link>
            </Box>
          </Box>
            </Paper>
          </Container>
        </Box>
        
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative', overflow: 'hidden' }}>
          {/* Animated gradient backdrop mapped to app aesthetics */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(-45deg, #0d9488, #14b8a6, #0284c7, #3b82f6)',
              backgroundSize: '400% 400%',
              animation: `${gradientShift} 15s ease infinite`,
              opacity: 0.9,
            }}
          />
          {/* Dark mode overlay */}
          <Box sx={{
            position: 'absolute', inset: 0, 
            background: 'var(--bg-main)', 
            opacity: 0.1,
            mixBlendMode: 'multiply'
          }} />
          
          {/* Optional watermark logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="Institute Watermark"
            onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
            sx={{ position: 'absolute', right: 32, top: 32, height: 56, opacity: 0.9, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
          />
          
          {/* Decorative glass elements */}
          <Box sx={{ position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)', top: '-10%', left: '-10%' }} />
          <Box sx={{ position: 'absolute', width: '30vw', height: '30vw', borderRadius: '50%', background: 'rgba(0,0,0,0.2)', filter: 'blur(60px)', bottom: '-5%', right: '-5%' }} />
          
          {/* Headline and bullets */}
          <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 8, zIndex: 10 }}>
            <Paper elevation={0} sx={{ 
              p: 5, borderRadius: 4, 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(16px)', 
              border: '1px solid rgba(255,255,255,0.2)',
              maxWidth: 500
            }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 2, fontFamily: '"Plus Jakarta Sans", sans-serif', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                Welcome to YBIT Labs
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, fontWeight: 500, lineHeight: 1.4 }}>
                A premium operating portal to efficiently manage institutional labs, assets, and maintenance schedules.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Track equipment seamlessly</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Log & resolve maintenance quickly</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Actionable insights via dashboard</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
