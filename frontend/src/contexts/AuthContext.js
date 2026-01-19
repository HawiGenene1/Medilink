// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Development-only mock user
const devUser = {
  _id: 'dev-user-123',
  email: 'dev@example.com',
  firstName: 'Dev',
  lastName: 'User',
  role: 'customer',
  isEmailVerified: true
};

// Development-only mock token
const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZXYtdXNlci0xMjMiLCJlbWFpbCI6ImRldkBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTYzNTc5MDQwMCwiZXhwIjoxNjM1ODc2ODAwfQ.mock-token-for-development';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  // Check if user is logged in on initial load
  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      api.get('/auth/current-user')
        .then(response => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Auto-login in development mode
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          _id: 'cashier123',
          firstName: 'Test',
          lastName: 'Cashier',
          email: 'cashier@test.com',
          role: 'cashier',
          pharmacyId: '12345'
        };
        const mockToken = 'mock-jwt-token-for-cashier';

        console.log('🔓 Auto-logging in as Cashier (Dev Mode)');
        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('token', mockToken);
      }
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    // In development, return mock user based on email
    if (process.env.NODE_ENV === 'development') {
      let role = 'customer';
      if (email.includes('admin')) role = 'admin';
      if (email.includes('pharmacy')) role = 'pharmacy_admin';
      if (email.includes('staff')) role = 'pharmacy_staff';
      if (email.includes('cashier')) role = 'cashier';
      if (email.includes('delivery')) role = 'delivery';

      const mockUser = {
        _id: 'mock-user-' + role,
        email,
        firstName: role.toUpperCase(),
        lastName: 'User',
        role: role
      };

      // Create a dummy JWT with the role encoded
      const mockToken = `header.${btoa(JSON.stringify({ email, role }))}.signature`;

      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('token', mockToken);
      return { success: true, user: mockUser };
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true, user }; // Return user for redirect logic
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/'); // Redirect to home on logout
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === requiredRole;
  };

  // Check if user has any of the required roles
  const hasAnyRole = (roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;