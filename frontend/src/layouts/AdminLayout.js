import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
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
    CarOutlined
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
            label: 'Users',
        },
        {
            key: '/admin/delivery-applications',
            icon: <CarOutlined />,
            label: 'Delivery Applications',
        },
        {
            key: '/admin/pharmacies',
            icon: <ShopOutlined />,
            label: 'Pharmacies',
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
            role="admin"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default AdminLayout;
