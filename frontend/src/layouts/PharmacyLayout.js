import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    MedicineBoxOutlined,
    ShoppingOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const PharmacyLayout = () => {
    const { user } = useAuth();

    // Determine if user is admin or staff to show appropriate menu items
    const isOwner = user?.role === 'pharmacy_admin';

    const menuItems = [
        {
            key: '/pharmacy-admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            hidden: !isOwner
        },
        {
            key: '/pharmacy-staff/inventory',
            icon: <MedicineBoxOutlined />,
            label: 'Inventory',
        },
        {
            key: '/pharmacy-staff/orders',
            icon: <ShoppingOutlined />,
            label: 'Orders',
        },
        {
            key: '/pharmacy-admin/staff',
            icon: <TeamOutlined />,
            label: 'Staff Management',
            hidden: !isOwner
        },
    ].filter(item => !item.hidden);

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="pharmacy"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default PharmacyLayout;
