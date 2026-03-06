import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    FileTextOutlined,
    SettingOutlined
} from '@ant-design/icons';

const CashierLayout = () => {
    const menuItems = [
        {
            key: '/cashier/dashboard',
            icon: <AppstoreOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/cashier/approved',
            icon: <ClockCircleOutlined />,
            label: 'Pending Payments',
        },
        {
            key: '/cashier/transactions',
            icon: <CheckCircleOutlined />,
            label: 'Transactions',
        },
        {
            key: '/cashier/reports',
            icon: <FileTextOutlined />,
            label: 'Reports',
        },
        {
            key: '/cashier/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        }
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="cashier"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default CashierLayout;
