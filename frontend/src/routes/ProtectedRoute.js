import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

/**
 * Protected Route Component
 * Restricts access to authenticated users with specific roles
 * @param {ReactNode} children - Child components to render (optional)
 * @param {Array|String} allowedRoles - Role(s) allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }


  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = user?.role?.toLowerCase();

    if (!roles.includes(userRole)) {
      // Redirect to unauthorized page or home
      return <Navigate to="/" replace />;
    }

    // Special handling for Delivery Partners: 
    // If they are pending, they MUST go to onboarding. 
    // If they are active, they MUST NOT go to onboarding (handled in component or here).
    if (userRole === 'delivery') {
      const isPending = user.status === 'pending';
      const isAccessingOnboarding = window.location.pathname.includes('/auth/delivery/onboarding');

      if (isPending && !isAccessingOnboarding) {
        return <Navigate to="/auth/delivery/onboarding" replace />;
      }

      if (!isPending && isAccessingOnboarding) {
        return <Navigate to="/delivery/dashboard" replace />;
      }
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
