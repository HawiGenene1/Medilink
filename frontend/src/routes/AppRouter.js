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
import PharmacyRegister from '../pages/auth/PharmacyRegister';

// Pages
import Home from '../pages/Home';
import CustomerHome from '../pages/customer/Home';
import MedicineList from '../pages/medicines/MedicineList';
import MedicineDetail from '../pages/medicines/MedicineDetail';

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pharmacy/register" element={<PharmacyRegister />} />
      </Route>

      {/* Main Routes */}
      <Route element={<MainLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/medicines" element={<MedicineList />} />
  <Route path="/medicines/:id" element={<MedicineDetail />} />
        
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