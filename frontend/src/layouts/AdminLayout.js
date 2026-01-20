import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    FileTextOutlined
} from '@ant-design/icons';

const AdminLayout = () => {
    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Overview',
        },
        {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: 'User Management',
        },
        {
            key: '/admin/pharmacies',
            icon: <SafetyCertificateOutlined />,
            label: 'Pharmacy Approvals',
        },
        {
            key: '/admin/logs',
            icon: <FileTextOutlined />,
            label: 'System Logs',
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
