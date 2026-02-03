import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import PharmacyAdminLayout from '../layouts/PharmacyAdminLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Components
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import DeliveryRegister from '../pages/auth/DeliveryRegister';
import DeliveryOnboarding from '../pages/auth/DeliveryOnboarding';
import PharmacyRegister from '../pages/auth/PharmacyRegister';
import OwnerLogin from '../pages/auth/OwnerLogin';
import OwnerRegister from '../pages/auth/OwnerRegister';
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

// Owner Pages
import OwnerDashboard from '../pages/owner/Dashboard';
import PharmacyDetails from '../pages/owner/PharmacyDetails';
import Inventory from '../pages/owner/Inventory'; // Fixed name
import Orders from '../pages/owner/Orders'; // Fixed name
import StaffManagement from '../pages/owner/StaffManagement';
import OwnerSubscription from '../pages/owner/Subscription';
import OwnerReports from '../pages/owner/Reports';
import OwnerAnalytics from '../pages/owner/Analytics';
import OwnerSettings from '../pages/owner/Settings';
import OwnerProfile from '../pages/owner/Profile';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UsersManagement from '../pages/admin/Users';
import PendingRegistrations from '../pages/admin/Users/PendingRegistrations';
import PharmaciesManagement from '../pages/admin/Pharmacies/PharmacyList';
import AdminSettings from '../pages/admin/Settings/Settings';
import UserDetails from '../pages/admin/Users/UserDetails';
import PharmacyDetail from '../pages/admin/Pharmacies/PharmacyDetail';
import SystemMonitoring from '../pages/admin/Monitoring/SystemMonitoring';
import AuditLogs from '../pages/admin/Audit/AuditLogs';
import Communication from '../pages/admin/Communication/Communication';
import DataManagement from '../pages/admin/Data/DataManagement';
import SecurityDashboard from '../pages/admin/Security/SecurityDashboard';
import Analytics from '../pages/admin/Analytics/Analytics';
import OrdersManagement from '../pages/admin/Orders/OrdersList';

// import UserManagement from '../pages/admin/UserManagement'; 

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
        <Route path="/auth/owner/login" element={<OwnerLogin />} />
        <Route path="/auth/owner/register" element={<OwnerRegister />} />
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
            Let's use MainLayout as a safe default for now. */}
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
      <Route element={<ProtectedRoute allowedRoles={['admin', 'system_admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/users/:id" element={<UserDetails />} />
          <Route path="/admin/registrations/pending" element={<PendingRegistrations />} />
          <Route path="/admin/pharmacies" element={<PharmaciesManagement />} />
          <Route path="/admin/pharmacies/:id" element={<PharmacyDetail />} />
          <Route path="/admin/orders" element={<OrdersManagement />} />
          <Route path="/admin/monitoring" element={<SystemMonitoring />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/communication" element={<Communication />} />
          <Route path="/admin/data" element={<DataManagement />} />
          <Route path="/admin/security" element={<SecurityDashboard />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Protected Routes - Pharmacy Owner */}
      <Route element={<ProtectedRoute allowedRoles={['pharmacy_owner']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/pharmacy" element={<PharmacyDetails />} />
          <Route path="/owner/inventory" element={<Inventory />} />
          <Route path="/owner/orders" element={<Orders />} />
          <Route path="/owner/staff" element={<StaffManagement />} />
          <Route path="/owner/subscription" element={<OwnerSubscription />} />
          <Route path="/owner/reports" element={<OwnerReports />} />
          <Route path="/owner/analytics" element={<OwnerAnalytics />} />
          <Route path="/owner/settings" element={<OwnerSettings />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
        </Route>
      </Route>

      {/* Redirects & Fallbacks */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;