import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import PharmacyAdminLayout from '../layouts/PharmacyAdminLayout';
import AdminLayout from '../layouts/AdminLayout';

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
import OrderCheckout from '../pages/customer/OrderCheckout'; // Real Chapa Payment
import PaymentStatus from '../pages/customer/PaymentStatus'; // Payment Verification
import InvoicePage from '../pages/customer/InvoicePage'; // Invoice View
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

// Delivery Pages
import DeliveryLayout from '../layouts/DeliveryLayout';
import DeliveryDashboard from '../pages/delivery/Dashboard';
import DeliveryDetails from '../pages/delivery/DeliveryDetails';
import DeliveryProfile from '../pages/delivery/Profile';

// Cashier Pages
import CashierDashboard from '../pages/cashier/Dashboard';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminPharmacies from '../pages/admin/Pharmacies/PharmacyList';
import AdminPharmacyDetail from '../pages/admin/Pharmacies/PharmacyDetail';
import AdminDeliveryRegistrations from '../pages/admin/DeliveryApplications/DeliveryApplicationList';
import AdminDeliveryRegistrationDetail from '../pages/admin/DeliveryApplications/DeliveryApplicationDetail';
import AdminMonitoring from '../pages/admin/Monitoring/SystemMonitoring';
import AdminAudit from '../pages/admin/Audit/AuditLogs';
import AdminCommunication from '../pages/admin/Communication/Communication';
import AdminData from '../pages/admin/Data/DataManagement';
import AdminSecurity from '../pages/admin/Security/SecurityDashboard';
import AdminAnalytics from '../pages/admin/Analytics/Analytics';
import AdminSettings from '../pages/admin/Settings/Settings';

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
        {/* Using MainLayout or creating a specific CashierLayout if needed. 
            For now assuming MainLayout or direct component rendering. 
            CashierDashboard usually has its own sidebar/layout logic inside or needs a layout.
            Let's use MainLayout for consistency if CashierLayout doesn't exist yet, 
            or better: specific layout implies Sidebar. 
            I will use MainLayout as a safe default for now. */}
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
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
        </Route>
      </Route>

      {/* Protected Routes - System Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
          <Route path="/admin/pharmacies/:id" element={<AdminPharmacyDetail />} />
          <Route path="/admin/registrations/pending" element={<AdminDeliveryRegistrations />} />
          <Route path="/admin/registrations/:id" element={<AdminDeliveryRegistrationDetail />} />
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/communication" element={<AdminCommunication />} />
          <Route path="/admin/data" element={<AdminData />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Redirects & Fallbacks */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;