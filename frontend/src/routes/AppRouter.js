import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import OwnerLayout from '../layouts/OwnerLayout';

// Components
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import DeliveryRegister from '../pages/auth/DeliveryRegister';
import DeliveryOnboarding from '../pages/auth/DeliveryOnboarding';
import PharmacyRegister from '../pages/auth/PharmacyRegister';
<<<<<<< HEAD
import OwnerLogin from '../pages/auth/OwnerLogin';
import OwnerRegister from '../pages/auth/OwnerRegister';
=======
import VerifyEmail from '../pages/auth/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword';
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1

// Page Imports
import Home from '../pages/Home';
import MedicineList from '../pages/medicines/MedicineList';
import MedicineDetail from '../pages/medicines/MedicineDetail';
import Pharmacies from '../pages/customer/Pharmacies';
import About from '../pages/About';

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
import ActiveDeliveries from '../pages/delivery/ActiveDeliveries';
import DeliveryHistory from '../pages/delivery/DeliveryHistory';
import DeliveryEarnings from '../pages/delivery/DeliveryEarnings';
import DeliverySettings from '../pages/delivery/DeliverySettings';

<<<<<<< HEAD
=======
// Pharmacy Pages
import PharmacyLayout from '../layouts/PharmacyLayout';
import Inventory from '../pages/pharmacy-staff/Inventory';
import PharmacyDashboard from '../pages/pharmacy-admin/Dashboard';
import DeliveryNotifications from '../pages/delivery/Notifications';
import PharmacyNotifications from '../pages/pharmacy/Notifications';

>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
// Admin & Other Pages
import AdminDashboard from '../pages/admin/Dashboard';
import OwnerDashboard from '../pages/owner/Dashboard';
import OwnerOrders from '../pages/owner/Orders';
import StaffManagement from '../pages/owner/StaffManagement';
import PharmacyDetails from '../pages/owner/PharmacyDetails';
import OwnerProfile from '../pages/owner/Profile';
import OwnerSettings from '../pages/owner/Settings';
import Subscription from '../pages/owner/Subscription';
import Reports from '../pages/owner/Reports';
import Analytics from '../pages/owner/Analytics';
import OwnerInventory from '../pages/owner/Inventory';
import OwnerNotifications from '../pages/owner/Notifications';
import CashierDashboard from '../pages/cashier/Dashboard';
<<<<<<< HEAD
import StaffDashboard from '../pages/owner/StaffDashboard';
import AddInventory from '../pages/owner/Inventory/AddInventory';
import DeliveryDashboard from '../pages/delivery/Dashboard';
=======

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
import AdminNotifications from '../pages/admin/Notifications';
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1

/**
 * Helper component to switch between Staff and Owner dashboard
 */
const PharmacyDashboard = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const isStaff = ['staff', 'pharmacist', 'technician', 'cashier', 'assistant'].includes(role);
  return isStaff ? <StaffDashboard /> : <OwnerDashboard />;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/medicines/:id" element={<MedicineDetail />} />
<<<<<<< HEAD
=======
        <Route path="/pharmacies" element={<Pharmacies />} />
        <Route path="/about" element={<About />} />
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/delivery/register" element={<DeliveryRegister />} />
        <Route path="/auth/delivery/onboarding" element={<DeliveryOnboarding />} />
        <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
<<<<<<< HEAD
        <Route path="/auth/owner/login" element={<OwnerLogin />} />
        <Route path="/auth/owner/register" element={<OwnerRegister />} />
=======
        <Route path="/auth/verify" element={<VerifyEmail />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
      </Route>

      {/* Protected Routes - Customer */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer/home" element={<CustomerDashboard />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
<<<<<<< HEAD
=======

>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
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

<<<<<<< HEAD
=======
      {/* Protected Routes - Delivery */}
      <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
        <Route element={<DeliveryLayout />}>
          <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
          <Route path="/delivery/active" element={<ActiveDeliveries />} />
          <Route path="/delivery/history" element={<DeliveryHistory />} />
          <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
          <Route path="/delivery/details/:id" element={<DeliveryDetails />} />
          <Route path="/delivery/profile" element={<DeliveryProfile />} />
          <Route path="/delivery/settings" element={<DeliverySettings />} />
          <Route path="/delivery/notifications" element={<DeliveryNotifications />} />
        </Route>
      </Route>

      {/* Protected Routes - Pharmacy */}
      <Route element={<ProtectedRoute allowedRoles={['pharmacy_admin', 'pharmacy_staff']} />}>
        <Route element={<PharmacyLayout />}>
          <Route path="/pharmacy-staff/inventory" element={<Inventory />} />
          <Route path="/pharmacy-admin/dashboard" element={<PharmacyDashboard />} />
          <Route path="/pharmacy-admin/notifications" element={<PharmacyNotifications />} />
          <Route path="/pharmacy-staff/notifications" element={<PharmacyNotifications />} />
        </Route>
      </Route>

>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
      {/* Protected Routes - Cashier */}
      <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
      </Route>

<<<<<<< HEAD
      {/* Protected Routes - Delivery */}
      <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
      </Route>

=======
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
      {/* Protected Routes - Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
<<<<<<< HEAD
=======

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
          <Route path="/admin/notifications" element={<AdminNotifications />} />
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
        </Route>
      </Route>

      {/* Shared Owner & Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={['pharmacy_owner', 'staff', 'pharmacist', 'technician', 'cashier', 'assistant', 'pharmacy_staff']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner/dashboard" element={<PharmacyDashboard />} />
          <Route path="/owner/inventory" element={<OwnerInventory />} />
          <Route path="/owner/inventory/add" element={<AddInventory />} />
          <Route path="/owner/orders" element={<OwnerOrders />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
          <Route path="/owner/notifications" element={<OwnerNotifications />} />
        </Route>
      </Route>

      {/* Exclusive Owner Routes */}
      <Route element={<ProtectedRoute allowedRoles={['pharmacy_owner']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner/staff" element={<StaffManagement />} />
          <Route path="/owner/pharmacy" element={<PharmacyDetails />} />
          <Route path="/owner/subscription" element={<Subscription />} />
          <Route path="/owner/reports" element={<Reports />} />
          <Route path="/owner/analytics" element={<Analytics />} />
          <Route path="/owner/settings" element={<OwnerSettings />} />
        </Route>
      </Route>

      {/* Redirects & Fallbacks */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
