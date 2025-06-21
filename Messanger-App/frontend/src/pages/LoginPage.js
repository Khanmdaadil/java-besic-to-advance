import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, TextField, Button, Typography, 
  Paper, Box, Avatar, CssBaseline, 
  Alert, CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || "/chat";

  // If user is already logged in, redirect to where they were trying to go
  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const success = await login(username, password);
      
      if (success) {
        // Navigate to where they were trying to go before redirect
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Failed to sign in. Please try again.');
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Don't have an account? Sign Up
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Secure Messenger - End-to-End Encrypted Messaging
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
