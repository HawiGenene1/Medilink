import React from 'react';
import { Outlet } from 'react-router-dom';
import CommonDashboardLayout from './CommonDashboardLayout';
import {
    AppstoreOutlined,
    SearchOutlined,
    FileTextOutlined,
    ShoppingCartOutlined,
    HeartOutlined,
    EnvironmentOutlined,
    UserOutlined,
    SettingOutlined
} from '@ant-design/icons';

const CustomerLayout = () => {
    const menuItems = [
        {
            key: '/customer/dashboard',
            icon: <AppstoreOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/customer/medicines',
            icon: <SearchOutlined />,
            label: 'Find Medicines',
        },
        {
            key: '/customer/cart',
            icon: <ShoppingCartOutlined />,
            label: 'My Cart',
        },
        {
            key: '/customer/prescriptions',
            icon: <FileTextOutlined />,
            label: 'My Prescriptions',
        },
        {
            key: '/customer/orders',
            icon: <ShoppingCartOutlined />,
            label: 'My Orders',
        },
        {
            key: '/customer/favorites',
            icon: <HeartOutlined />,
            label: 'Favorites',
        },
        {
            key: '/customer/pharmacies',
            icon: <EnvironmentOutlined />,
            label: 'Nearby Pharmacies',
        },
        {
            key: '/customer/profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: '/customer/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        }
    ];

    return (
        <CommonDashboardLayout
            menuItems={menuItems}
            role="customer"
        >
            <Outlet />
        </CommonDashboardLayout>
    );
};

export default CustomerLayout;
