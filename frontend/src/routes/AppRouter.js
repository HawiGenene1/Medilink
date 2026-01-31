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
import AdminLayout from '../layouts/AdminLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import OwnerDashboard from '../pages/owner/Dashboard';
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
import DeliveryDashboard from '../pages/delivery/Dashboard';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/medicines/:id" element={<MedicineDetail />} />
        {/* <Route path="/pharmacies" element={<PharmacyFinder />} /> */}
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
          {/* Add placeholder routes for other menu items to avoid 404s in demo */}
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
        {/* <Route path="/cashier/pos" element={<POS />} /> */}
      </Route>

      {/* Protected Routes - Delivery */}
      <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        {/* <Route path="/delivery/tasks" element={<DeliveryTasks />} /> */}
      </Route>

      {/* Protected Routes - Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* <Route path="/admin/users" element={<UserManagement />} /> */}
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['PHARMACY_OWNER']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/staff" element={<StaffManagement />} />
          <Route path="/owner/inventory" element={<OwnerInventory />} />
          <Route path="/owner/pharmacy" element={<PharmacyDetails />} />
          <Route path="/owner/subscription" element={<Subscription />} />
          <Route path="/owner/reports" element={<Reports />} />
          <Route path="/owner/analytics" element={<Analytics />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
          <Route path="/owner/settings" element={<OwnerSettings />} />
          <Route path="/owner/notifications" element={<OwnerNotifications />} />
        </Route>
      </Route>
      {/* Redirects & Fallbacks */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;