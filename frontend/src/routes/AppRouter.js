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
import PharmacyRegister from '../pages/auth/PharmacyRegister';
import OwnerLogin from '../pages/auth/OwnerLogin';
import OwnerRegister from '../pages/auth/OwnerRegister';

// Pages
import Home from '../pages/Home';
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
import MedicineList from '../pages/medicines/MedicineList';
import MedicineDetail from '../pages/medicines/MedicineDetail';

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
import StaffDashboard from '../pages/owner/StaffDashboard';
import AddInventory from '../pages/owner/Inventory/AddInventory';
import DeliveryDashboard from '../pages/delivery/Dashboard';

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
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
        <Route path="/auth/owner/login" element={<OwnerLogin />} />
        <Route path="/auth/owner/register" element={<OwnerRegister />} />
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

      {/* Protected Routes - Cashier */}
      <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
      </Route>

      {/* Protected Routes - Delivery */}
      <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
      </Route>

      {/* Protected Routes - Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
