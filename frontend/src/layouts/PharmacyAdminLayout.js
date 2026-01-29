import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    SolutionOutlined,
    CrownOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    SettingOutlined
} from '@ant-design/icons';

const PharmacyAdminLayout = () => {
    const menuItems = [
        {
            key: '/pharmacy-admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/pharmacy-admin/registration',
            icon: <SolutionOutlined />,
            label: 'Registration Requests',
        },
        {
            key: '/pharmacy-admin/subscriptions',
            icon: <CrownOutlined />,
            label: 'Subscription Plans',
        },
        {
            key: '/pharmacy-admin/pharmacy-control',
            icon: <SafetyCertificateOutlined />,
            label: 'Pharmacy Control',
        },
        {
            key: '/pharmacy-admin/reports',
            icon: <BarChartOutlined />,
            label: 'Analytics & Reports',
        },
        {
            key: '/pharmacy-admin/settings',
            icon: <SettingOutlined />,
            label: 'Platform Settings',
        }
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="pharmacy-admin"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default PharmacyAdminLayout;
