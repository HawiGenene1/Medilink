import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    MedicineBoxOutlined,
    ShoppingOutlined,
    TeamOutlined,
    AlertOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const PharmacyLayout = () => {
    const { user } = useAuth();

    // Determine if user is admin or staff to show appropriate menu items
    const isOwner = user?.role === 'pharmacy_admin';

    const menuItems = [
        {
            key: isOwner ? '/pharmacy-admin/dashboard' : '/pharmacy-staff/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/pharmacy-staff/medicines',
            icon: <MedicineBoxOutlined />,
            label: 'Medicines',
        },
        {
            key: '/pharmacy-staff/orders',
            icon: <ShoppingOutlined />,
            label: 'Orders',
        },
        {
            key: '/pharmacy-staff/inventory-alerts',
            icon: <AlertOutlined />,
            label: 'Inventory Alerts',
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
