import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import { OWNER_MENU_ITEMS } from '../constants/ownerConstants';
import { useAuth } from '../contexts/AuthContext';

const OwnerLayout = () => {
    const { user } = useAuth();

    // Filter menu items based on operational permissions
    const filteredItems = OWNER_MENU_ITEMS.filter(item => {
        // Show Inventory only if manageInventory permission is enabled
        if (item.key === '/owner/inventory') {
            return user?.operationalPermissions?.manageInventory === true;
        }
        // Show all other menu items
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
