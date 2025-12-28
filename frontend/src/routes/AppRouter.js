// frontend/src/routes/AppRouter.js
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load components for better performance
const Home = lazy(() => import('../pages/Home'));
const MedicineList = lazy(() => import('../pages/medicines/MedicineList'));
const MedicineDetail = lazy(() => import('../pages/medicines/MedicineDetail'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const PrescriptionReview = lazy(() => import('../components/pharmacy-staff/PrescriptionReview'));

// Customer Pages
const CustomerLayout = lazy(() => import('../layouts/CustomerLayout'));
const CustomerHome = lazy(() => import('../pages/customer/Home'));
const PrescriptionsPage = lazy(() => import('../pages/customer/Prescriptions'));
const OrdersPage = lazy(() => import('../pages/customer/Orders'));
const CartPage = lazy(() => import('../pages/customer/Cart'));
const ProfilePage = lazy(() => import('../pages/customer/Profile'));

// Loading component for Suspense fallback
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<MedicineList />} />
          <Route path="/medicines/:id" element={<MedicineDetail />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Customer Routes - Protected */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerHome />} />
          <Route path="home" element={<CustomerHome />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="orders" element={<OrdersPage />}>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<OrdersPage />} />
            <Route path=":orderId" element={<div>Order Details</div>} />
          </Route>
          <Route path="cart" element={<CartPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Development-only routes */}
        {process.env.NODE_ENV === 'development' && (
          <Route
            path="/dev/customer"
            element={
              <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <CustomerLayout>
                  <CustomerHome />
                </CustomerLayout>
              </div>
            }
          />
        )}

        {/* Pharmacy Staff Routes */}
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
    </Suspense>
  );
};

export default AppRouter;