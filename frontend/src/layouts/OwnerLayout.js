import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import { OWNER_MENU_ITEMS } from '../constants/ownerConstants';
import { useAuth } from '../contexts/AuthContext';

const OwnerLayout = () => {
    const { user } = useAuth();

    // Filter menu items based on operational permissions and role
    const filteredItems = OWNER_MENU_ITEMS.filter(item => {
        // Staff specifically allowed routes
        const staffAllowedKeys = [
            '/owner/dashboard',
            '/owner/inventory',
            '/owner/orders',
            '/owner/profile',
            '/owner/notifications'
        ];

        // If staff, strictly filter to allowed keys only
        if (user?.role === 'staff' && !staffAllowedKeys.includes(item.key)) {
            return false;
        }

        // Show Inventory only if manageInventory permission is enabled (for both owner/staff)
        if (item.key === '/owner/inventory') {
            return user?.role === 'PHARMACY_OWNER' || user?.operationalPermissions?.manageInventory === true;
        }

        // Show Orders only if prepareOrders or manageInventory permission is enabled
        if (item.key === '/owner/orders') {
            const hasOrderPerm = user?.operationalPermissions?.prepareOrders === true || user?.operationalPermissions?.manageInventory === true;
            return user?.role === 'PHARMACY_OWNER' || hasOrderPerm;
        }

        // Show all other menu items (already filtered for staff above)
        return true;
    });

    // Transform constants into the format expected by the layout (mapping icons to components)
    const menuItems = filteredItems.map(item => ({
        ...item,
        icon: React.createElement(item.icon)
    }));

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="owner"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default OwnerLayout;
