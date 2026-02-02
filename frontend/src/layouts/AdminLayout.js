import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    FileTextOutlined,
    ShopOutlined,
    DollarOutlined,
    BarChartOutlined,
    SettingOutlined,
    BellOutlined,
    LogoutOutlined
} from '@ant-design/icons';

const AdminLayout = () => {
    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: 'User Management',
        },
        {
            key: '/admin/pharmacies',
            icon: <ShopOutlined />,
            label: 'Pharmacy Management',
        },
        {
            key: '/admin/subscriptions',
            icon: <DollarOutlined />,
            label: 'Subscriptions',
        },
        {
            key: '/admin/registrations/pending',
            icon: <FileTextOutlined />,
            label: 'Approvals',
        },
        {
            key: '/admin/analytics',
            icon: <BarChartOutlined />,
            label: 'Analytics & Reports',
        },
        {
            key: '/admin/audit',
            icon: <SafetyCertificateOutlined />,
            label: 'System Logs',
        },
        {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            key: '/admin/notifications',
            icon: <BellOutlined />,
            label: 'Notifications',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true
        }
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="admin"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default AdminLayout;
