import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    FileTextOutlined,
    ShopOutlined,
    MonitorOutlined,
    MessageOutlined,
    DatabaseOutlined,
    LockOutlined,
    BarChartOutlined,
    SettingOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';

const AdminLayout = () => {
    const { user } = useAuth();
    const role = user?.role || 'admin';

    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: 'Users',
        },
        {
            key: '/admin/registrations/pending',
            icon: <FileTextOutlined />,
            label: 'Pending Registrations',
        },
        {
            key: '/admin/orders',
            icon: <ShoppingCartOutlined />,
            label: 'Orders',
        },
        {
            key: '/admin/monitoring',
            icon: <MonitorOutlined />,
            label: 'Monitoring',
        },
        {
            key: '/admin/audit',
            icon: <SafetyCertificateOutlined />,
            label: 'Audit & Compliance',
        },
        {
            key: '/admin/communication',
            icon: <MessageOutlined />,
            label: 'Communication',
        },
        {
            key: '/admin/data',
            icon: <DatabaseOutlined />,
            label: 'Data Management',
        },
        {
            key: '/admin/security',
            icon: <LockOutlined />,
            label: 'Security',
        },
        {
            key: '/admin/analytics',
            icon: <BarChartOutlined />,
            label: 'Business Intelligence',
        },
        {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'System Settings',
        },
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role={role}
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default AdminLayout;
