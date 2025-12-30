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
// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
     // In development, automatically log in with dev user
  if (process.env.NODE_ENV === 'development' && !user) {
    setUser(devUser);
    setIsAuthenticated(true);
    setLoading(false);
    return;
  }
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
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
     // In development, bypass actual login
  if (process.env.NODE_ENV === 'development') {
    setUser(devUser);
    setIsAuthenticated(true);
    return { success: true, user: devUser };
  }
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout function
  const logout = () => {
     // In development, just reset to dev user
  if (process.env.NODE_ENV === 'development') {
    setUser(devUser);
    return;
  }
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
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
    isAuthenticated:  process.env.NODE_ENV === 'development' ? true : isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;