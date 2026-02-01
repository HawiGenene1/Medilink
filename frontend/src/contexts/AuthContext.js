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
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // In development, check if it's a mock token and restore user from it
      if (process.env.NODE_ENV === 'development' && token.startsWith('header.')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));

          // Restore operational permissions from localStorage if available
          const storedPermissions = localStorage.getItem('operationalPermissions');
          const operationalPermissions = storedPermissions ? JSON.parse(storedPermissions) : {};

          const mockUser = {
            _id: 'mock-user-' + payload.role,
            email: payload.email,
            firstName: payload.role.toUpperCase(),
            lastName: 'User',
            role: payload.role,
            operationalPermissions: operationalPermissions
          };
          setUser(mockUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } catch (e) {
          // Invalid token format, continue to API check
        }
      }

      api.get('/auth/me')
        .then(response => {
          setUser(response.data.user);
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
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    // In development, return mock user based on email
    if (process.env.NODE_ENV === 'development') {
      let role = 'customer';
      if (email.includes('admin')) role = 'admin';
      if (email.includes('cashier')) role = 'cashier';
      if (email.includes('delivery')) role = 'delivery';
      if (email.includes('owner') || email.includes('pharmacy')) role = 'PHARMACY_OWNER';
      if (email.includes('staff')) role = 'staff';

      // Restore operational permissions from localStorage if available
      const storedPermissions = localStorage.getItem('operationalPermissions');
      let operationalPermissions = storedPermissions ? JSON.parse(storedPermissions) : null;

      // Default permissions for testing if none exist
      if (!operationalPermissions && (role === 'staff' || role === 'PHARMACY_OWNER')) {
        operationalPermissions = {
          manageInventory: true,
          prepareOrders: true,
          manageStaff: role === 'PHARMACY_OWNER'
        };
      } else if (!operationalPermissions) {
        operationalPermissions = {};
      }

      // Create a dummy JWT with the role encoded
      const STABLE_MOCK_PHARMACY_ID = '65a7d5c9f1a2b3c4d5e6f701';
      const mockToken = `header.${btoa(JSON.stringify({ email, role }))}.signature`;

      const mockUser = {
        _id: 'mock-user-' + role,
        email,
        firstName: role.toUpperCase(),
        lastName: 'User',
        role: role,
        pharmacyId: STABLE_MOCK_PHARMACY_ID,
        pharmacyName: 'MediLink Demo Pharmacy',
        operationalPermissions: operationalPermissions
      };

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

  // Specialized login for pharmacy owner
  const ownerLogin = async (email, password) => {
    try {
      const response = await api.post('/pharmacy-owner/login', { email, password });
      const { token, owner } = response.data;

      // Map 'owner' response to 'user' state for consistency
      const userObj = {
        ...owner,
        id: owner.id || owner._id,
        role: 'PHARMACY_OWNER',
        permissions: owner.permissions || []
      };

      localStorage.setItem('token', token);
      setUser(userObj);
      setIsAuthenticated(true);
      return { success: true, user: userObj };
    } catch (error) {
      console.error('Owner login failed:', error);
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

  // Update user data (e.g., after profile/permissions update)
  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));

    // In development mode, persist operational permissions to localStorage
    if (process.env.NODE_ENV === 'development' && userData.operationalPermissions) {
      localStorage.setItem('operationalPermissions', JSON.stringify(userData.operationalPermissions));
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    ownerLogin,
    logout,
    hasRole,
    hasAnyRole,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
