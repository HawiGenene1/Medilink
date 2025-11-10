import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Components
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Pages
import Home from '../pages/Home';
import CustomerHome from '../pages/customer/Home';

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        
        {/* Customer Routes */}
        <Route 
          path="/customer/home" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerHome />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

export default AppRouter;