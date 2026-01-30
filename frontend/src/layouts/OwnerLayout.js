import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import { OWNER_MENU_ITEMS } from '../constants/ownerConstants';

const OwnerLayout = () => {
    // Transform constants into the format expected by the layout (mapping icons to components)
    const menuItems = OWNER_MENU_ITEMS.map(item => ({
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
