// frontend/src/routes/AppRouter.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Home from '../pages/Home';
import MedicineList from '../pages/medicines/MedicineList';
import MedicineDetail from '../pages/medicines/MedicineDetail';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import PrescriptionReview from '../components/pharmacy-staff/PrescriptionReview';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <Routes>
      {/* Main Layout Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/medicines/:id" element={<MedicineDetail />} />
      </Route>

      {/* Auth Routes - Using AuthLayout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/prescriptions/review"
        element={
          <ProtectedRoute allowedRoles={['pharmacy_staff', 'pharmacy_admin', 'admin']}>
            <MainLayout>
              <PrescriptionReview />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;