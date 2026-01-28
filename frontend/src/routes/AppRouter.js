import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Components
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import DeliveryRegister from '../pages/auth/DeliveryRegister';
import DeliveryOnboarding from '../pages/auth/DeliveryOnboarding';
import PharmacyRegister from '../pages/auth/PharmacyRegister';
import VerifyEmail from '../pages/auth/VerifyEmail';

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
import CustomerOrders from '../pages/customer/Orders';
import CustomerOrderTracking from '../pages/customer/Orders/OrderTracking';
import CustomerPrescriptions from '../pages/customer/Prescriptions';
import CustomerPharmacies from '../pages/customer/Pharmacies';
import CustomerSettings from '../pages/customer/Settings';
import CustomerNotifications from '../pages/customer/Notifications';
import CustomerProfile from '../pages/customer/Profile';
import CustomerFavorites from '../pages/customer/Favorites';

// Delivery Pages
import DeliveryLayout from '../layouts/DeliveryLayout';
import DeliveryDashboard from '../pages/delivery/Dashboard';
import DeliveryDetails from '../pages/delivery/DeliveryDetails';
import DeliveryProfile from '../pages/delivery/Profile';

// Pharmacy Pages
import PharmacyLayout from '../layouts/PharmacyLayout';
import Inventory from '../pages/pharmacy-staff/Inventory';
import PharmacyDashboard from '../pages/pharmacy-admin/Dashboard';

// Admin & Other Pages
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import CashierDashboard from '../pages/cashier/Dashboard';

// Real Admin Components
import UsersList from '../pages/admin/Users/UsersList';
import UserDetails from '../pages/admin/Users/UserDetails';
import PendingRegistrations from '../pages/admin/Users/PendingRegistrations';
import PharmacyList from '../pages/admin/Pharmacies/PharmacyList';
import PharmacyDetail from '../pages/admin/Pharmacies/PharmacyDetail';
import SystemMonitoring from '../pages/admin/Monitoring/SystemMonitoring';
import AuditLogs from '../pages/admin/Audit/AuditLogs';
import SecurityDashboard from '../pages/admin/Security/SecurityDashboard';
import Communication from '../pages/admin/Communication/Communication';
import DataManagement from '../pages/admin/Data/DataManagement';
import Analytics from '../pages/admin/Analytics/Analytics';
import Settings from '../pages/admin/Settings/Settings';
import DeliveryApplicationList from '../pages/admin/DeliveryApplications/DeliveryApplicationList';
import DeliveryApplicationDetail from '../pages/admin/DeliveryApplications/DeliveryApplicationDetail';

const AppRouter = () => {
  return (
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
      </Route>

      {/* Protected Routes - Customer */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer/home" element={<CustomerDashboard />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />

          <Route path="/customer/medicines" element={<CustomerMedicines />} />
          <Route path="/customer/medicines/:id" element={<CustomerMedicineDetail />} />
          <Route path="/customer/cart" element={<CustomerCart />} />
          <Route path="/customer/checkout" element={<CustomerCheckout />} />
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

      {/* Protected Routes - Pharmacy */}
      <Route element={<ProtectedRoute allowedRoles={['pharmacy_admin', 'pharmacy_staff']} />}>
        <Route element={<PharmacyLayout />}>
          <Route path="/pharmacy-staff/inventory" element={<Inventory />} />
          <Route path="/pharmacy-admin/dashboard" element={<PharmacyDashboard />} />
        </Route>
      </Route>

      {/* Protected Routes - Cashier */}
      <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
        {/* <Route path="/cashier/pos" element={<POS />} /> */}
      </Route>

      {/* Protected Routes - Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* User Management */}
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/users/:id" element={<UserDetails />} />
          <Route path="/admin/registrations/pending" element={<PendingRegistrations />} />

          {/* Delivery Applications */}
          <Route path="/admin/delivery-applications" element={<DeliveryApplicationList />} />
          <Route path="/admin/delivery-applications/:id" element={<DeliveryApplicationDetail />} />

          {/* Pharmacy Management */}
          <Route path="/admin/pharmacies" element={<PharmacyList />} />
          <Route path="/admin/pharmacies/:id" element={<PharmacyDetail />} />

          {/* Monitoring & Security */}
          <Route path="/admin/monitoring" element={<SystemMonitoring />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/security" element={<SecurityDashboard />} />

          {/* Communication */}
          <Route path="/admin/communication" element={<Communication />} />

          {/* Data & Analytics */}
          <Route path="/admin/data" element={<DataManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />

          {/* Settings */}
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>
      {/* Redirects & Fallbacks */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;