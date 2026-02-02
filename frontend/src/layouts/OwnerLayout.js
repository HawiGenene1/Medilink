import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import { OWNER_MENU_ITEMS } from '../constants/ownerConstants';
import { useAuth } from '../contexts/AuthContext';

const OwnerLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Staff specifically allowed routes
    const staffAllowedKeys = [
        '/owner/dashboard',
        '/owner/inventory',
        '/owner/orders',
        '/owner/profile',
        '/owner/notifications'
    ];

    // Filter menu items based on explicit permissions and role restrictions
    const filteredItems = OWNER_MENU_ITEMS.filter(item => {
        const role = user?.role?.toLowerCase();
        const isOwner = role === 'pharmacy_owner';
        const isStaff = ['staff', 'pharmacist', 'technician', 'cashier', 'assistant', 'pharmacy_staff'].includes(role);

        // 1. Strict Restrictions for Staff (No access to management/config/reports)
        const ownerOnlyPages = [
            '/owner/staff',
            '/owner/pharmacy',
            '/owner/subscription',
            '/owner/reports',
            '/owner/analytics',
            '/owner/settings'
        ];
        if (isStaff && ownerOnlyPages.includes(item.key)) {
            return false;
        }

        // 2. Permanent visibility for Staff allowed pages
        if (isStaff) {
            return staffAllowedKeys.includes(item.key);
        }

        // 3. Owner visibility logic (Strict Permission-Based Access / Oversight Mode)
        if (isOwner) {
            // HIDE Inventory if the owner has explicitly disabled their own inventory view (Oversight Mode)
            const isOversightMode = user?.operationalPermissions?.prepareOrders === true && user?.operationalPermissions?.manageInventory === false;
            if (isOversightMode && (item.key === '/owner/inventory')) {
                return false;
            }
            return true;
        }

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
