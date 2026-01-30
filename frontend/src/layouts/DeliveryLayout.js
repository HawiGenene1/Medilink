import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    DashboardOutlined,
    CarOutlined,
    HistoryOutlined,
    WalletOutlined,
    UserOutlined,
    SettingOutlined
} from '@ant-design/icons';

const DeliveryLayout = () => {
    const menuItems = [
        {
            key: '/delivery/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/delivery/active', // Placeholder route
            icon: <CarOutlined />,
            label: 'Active Deliveries',
        },
        {
            key: '/delivery/history', // Placeholder route
            icon: <HistoryOutlined />,
            label: 'Delivery History',
        },
        {
            key: '/delivery/earnings', // Placeholder route
            icon: <WalletOutlined />,
            label: 'Earnings',
        },
        {
            key: '/delivery/profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: '/delivery/settings', // Placeholder route
            icon: <SettingOutlined />,
            label: 'Settings',
        }
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="delivery"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default DeliveryLayout;
