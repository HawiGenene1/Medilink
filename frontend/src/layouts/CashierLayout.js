import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
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
            key: '/cashier/pending',
            icon: <ClockCircleOutlined />,
            label: 'Payment Verification',
        },
        {
            key: '/cashier/transactions',
            icon: <CheckCircleOutlined />,
            label: 'Payment Monitoring',
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
