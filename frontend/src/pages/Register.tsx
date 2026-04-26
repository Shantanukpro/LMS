import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'admin' | 'student' | 'faculty' | 'lab_incharge',
  });
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, socialLoginAuth } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string, role: string) => {
    if (role === 'student' && email && !email.toLowerCase().endsWith('@ybit.ac.in')) {
      setEmailError('Students must register with their college email only (@ybit.ac.in)');
    } else {
      setEmailError('');
    }
  };

  const handleChange = (field: string) => (e: any) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'email' || field === 'role') {
        validateEmail(field === 'email' ? value : next.email, field === 'role' ? value : next.role);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      navigate('/');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          const messages: string[] = [];
          Object.entries(data).forEach(([field, value]) => {
            if (Array.isArray(value)) {
              messages.push(`${field}: ${value.join(' ')}`);
            } else if (typeof value === 'string') {
              messages.push(`${field}: ${value}`);
            }
          });
          setError(messages.join('\n') || 'Registration failed. Please try again.');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    const mockEmail = window.prompt(`[Mock ${provider} Registration]\nPlease enter the email returned by OAuth:\n(Hint: For '${formData.role}' role, students must use @ybit.ac.in)`);
    if (!mockEmail) return;

    try {
      setLoading(true);
      setError('');
      await socialLoginAuth({ provider, email: mockEmail, role: formData.role });
      navigate('/');
    } catch (err: any) {
      setError(typeof err.formattedMessage === 'string' ? err.formattedMessage : 'Social authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  const inputStyles = {
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
  };

  return (
    <Box sx={{ minHeight: '100svh', backgroundColor: 'var(--bg-main)' }}>
      <Box sx={{
        minHeight: '100svh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
      }}>
        {/* Left Side: Form */}
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
                maxWidth: 420,
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
                  sx={{ height: 48, mb: 1.5, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
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
                <Typography variant="subtitle2" sx={{ color: '#14b8a6', fontWeight: 600 }} gutterBottom>
                  Lab Management System
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Create your account below
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', '& .MuiAlert-icon': { color: '#e11d48' }, whiteSpace: 'pre-line' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} autoComplete="off">
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  required
                  value={formData.username}
                  onChange={handleChange('username')}
                  autoComplete="new-username"
                  sx={inputStyles}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
                  required
                  value={formData.email}
                  onChange={handleChange('email')}
                  autoComplete="new-email"
                  error={!!emailError}
                  helperText={emailError}
                  sx={inputStyles}
                />
                
                <FormControl fullWidth required sx={inputStyles}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={handleChange('role')}
                    sx={{
                       '& .MuiSelect-select': { color: 'var(--text-primary)' },
                       '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                       '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
                       '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6', borderWidth: '2px' },
                    }}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="admin">Admin / Professor</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                    <MenuItem value="lab_incharge">Lab Incharge</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
                  sx={inputStyles}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  autoComplete="new-password"
                  sx={{ ...inputStyles, mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !!emailError}
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
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>

                {/* Divider */}
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--border-color)' }} />
                  <Typography variant="body2" sx={{ px: 2, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Or sign up with
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
                </Box>
                
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      color: '#14b8a6', 
                      textDecoration: 'none', 
                      fontWeight: 600,
                      transition: 'opacity 0.2s',
                      '&:hover': { opacity: 0.8 } 
                    }}
                  >
                    Already have an account? Sign In
                  </Link>
                </Box>
              </Box>
            </Paper>
          </Container>
        </Box>
        
        {/* Right Side: Animated Visual */}
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
          
          {/* Interactive decorative objects */}
          <Box sx={{ position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)', top: '-10%', left: '-10%' }} />
          <Box sx={{ position: 'absolute', width: '30vw', height: '30vw', borderRadius: '50%', background: 'rgba(0,0,0,0.2)', filter: 'blur(60px)', bottom: '-5%', right: '-5%' }} />
          
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
                Join the platform to access institutional labs, register for classes, and manage lab assets efficiently.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Create tickets directly from lab PCs</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Automated attendance via QR forms</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <CheckCircleOutline sx={{ color: '#6ee7b7' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>Real-time inventory and software tracking</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
