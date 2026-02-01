import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import PharmacyAdminLayout from '../layouts/PharmacyAdminLayout';
import DeliveryLayout from '../layouts/DeliveryLayout';

// Components
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import DeliveryRegister from '../pages/auth/DeliveryRegister';
import DeliveryOnboarding from '../pages/auth/DeliveryOnboarding';
import PharmacyRegister from '../pages/auth/PharmacyRegister';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Page Imports
import Home from '../pages/Home';
import MedicineList from '../pages/medicines/MedicineList';
import MedicineDetail from '../pages/medicines/MedicineDetail';

// Customer Pages
import CustomerDashboard from '../pages/customer/Dashboard';
import CustomerMedicines from '../pages/customer/Medicines';
import CustomerMedicineDetail from '../pages/customer/Medicines/MedicineDetail';
import CustomerCart from '../pages/customer/Cart';
import CustomerCheckout from '../pages/customer/Checkout';
import OrderCheckout from '../pages/customer/OrderCheckout';
import PaymentStatus from '../pages/customer/PaymentStatus';
import InvoicePage from '../pages/customer/InvoicePage';
import CustomerOrders from '../pages/customer/Orders';
import CustomerOrderTracking from '../pages/customer/Orders/OrderTracking';
import CustomerPrescriptions from '../pages/customer/Prescriptions';
import CustomerPharmacies from '../pages/customer/Pharmacies';
import CustomerSettings from '../pages/customer/Settings';
import CustomerNotifications from '../pages/customer/Notifications';
import CustomerProfile from '../pages/customer/Profile';
import CustomerFavorites from '../pages/customer/Favorites';

// Pharmacy Admin Pages
import PharmacyAdminDashboard from '../pages/pharmacy-admin/Dashboard';
import PharmacyRegistration from '../pages/pharmacy-admin/PharmacyManagement';
import SubscriptionManagement from '../pages/pharmacy-admin/Subscriptions';
import PharmacyControl from '../pages/pharmacy-admin/PharmacyControl';
import PharmacyReports from '../pages/pharmacy-admin/Reports';
import PharmacySettings from '../pages/pharmacy-admin/Settings';
import PharmacyAdminProfile from '../pages/pharmacy-admin/Profile';
import PharmacyAdminNotifications from '../pages/pharmacy-admin/Notifications';

// Delivery Pages
import DeliveryDashboard from '../pages/delivery/Dashboard';
import DeliveryDetails from '../pages/delivery/DeliveryDetails';
import DeliveryProfile from '../pages/delivery/Profile';

// Lazy Loaded Components
const CashierLayout = lazy(() => import('../layouts/CashierLayout'));
const CashierDashboard = lazy(() => import('../pages/cashier/Dashboard'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Loading component..." />
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<MedicineList />} />
          <Route path="/medicines/:id" element={<MedicineDetail />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/delivery/register" element={<DeliveryRegister />} />
          <Route path="/auth/delivery/onboarding" element={<DeliveryOnboarding />} />
          <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes - Customer */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer/home" element={<CustomerDashboard />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/medicines" element={<CustomerMedicines />} />
            <Route path="/customer/medicines/:id" element={<CustomerMedicineDetail />} />
            <Route path="/customer/items" element={<CustomerCart />} />
            <Route path="/customer/cart" element={<CustomerCart />} />
            <Route path="/customer/checkout" element={<CustomerCheckout />} />
            <Route path="/customer/orders/:orderId/checkout" element={<OrderCheckout />} />
            <Route path="/customer/orders/:orderId/payment-status" element={<PaymentStatus />} />
            <Route path="/customer/orders/:orderId/invoice" element={<InvoicePage />} />
            <Route path="/customer/prescriptions" element={<CustomerPrescriptions />} />
            <Route path="/customer/orders" element={<CustomerOrders />} />
            <Route path="/customer/orders/track/:id" element={<CustomerOrderTracking />} />
            <Route path="/customer/favorites" element={<CustomerFavorites />} />
            <Route path="/customer/pharmacies" element={<CustomerPharmacies />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/settings" element={<CustomerSettings />} />
            <Route path="/customer/notifications" element={<CustomerNotifications />} />
          </Route>
        </Route>

        {/* Protected Routes - Delivery */}
        <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
          <Route element={<DeliveryLayout />}>
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/details/:id" element={<DeliveryDetails />} />
            <Route path="/delivery/profile" element={<DeliveryProfile />} />
          </Route>
        </Route>

        {/* Protected Routes - Cashier */}
        <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
          <Route element={<CashierLayout />}>
            <Route path="/cashier/dashboard" element={<CashierDashboard />} />
            <Route path="/cashier/pending" element={<CashierDashboard />} />
            <Route path="/cashier/transactions" element={<CashierDashboard />} />
            <Route path="/cashier/settings" element={<CashierDashboard />} />
            <Route path="/cashier/profile" element={<CashierDashboard />} />
            <Route path="/cashier/notifications" element={<CashierDashboard />} />
          </Route>
        </Route>

        {/* Protected Routes - Pharmacy Admin */}
        <Route element={<ProtectedRoute allowedRoles={['pharmacy_admin']} />}>
          <Route element={<PharmacyAdminLayout />}>
            <Route path="/pharmacy-admin/dashboard" element={<PharmacyAdminDashboard />} />
            <Route path="/pharmacy-admin/registration" element={<PharmacyRegistration />} />
            <Route path="/pharmacy-admin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/pharmacy-admin/pharmacy-control" element={<PharmacyControl />} />
            <Route path="/pharmacy-admin/reports" element={<PharmacyReports />} />
            <Route path="/pharmacy-admin/settings" element={<PharmacySettings />} />
            <Route path="/pharmacy-admin/profile" element={<PharmacyAdminProfile />} />
            <Route path="/pharmacy-admin/notifications" element={<PharmacyAdminNotifications />} />
          </Route>
        </Route>

        {/* Redirects & Fallbacks */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;