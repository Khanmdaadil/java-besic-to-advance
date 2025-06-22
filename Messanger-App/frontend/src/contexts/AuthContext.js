import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import { generateKeyPair } from '../utils/encryption';

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a token in localStorage
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        
        if (token && userId && username) {
          // Validate the token with the server if possible
          try {
            // Make a request to validate the token
            await AuthService.validateToken(token);
            
            // If successful, set the current user
            setCurrentUser({
              id: userId,
              username,
              token
            });
          } catch (error) {
            console.error('Token validation failed:', error);
            // If validation fails, clear the localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await AuthService.login(username, password);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('username', response.username);
        
        setCurrentUser({
          id: response.userId,
          username: response.username,
          token: response.token
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      // Generate encryption keys for the user
      const { publicKey, privateKey } = generateKeyPair();
      
      // Store private key securely
      localStorage.setItem('privateKey', privateKey);
      
      const response = await AuthService.register(username, email, password, publicKey);
      return response.message === 'User registered successfully';
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (currentUser) {
        await AuthService.logout(currentUser.username);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      setCurrentUser(null);
      navigate('/login');
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
