import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Modal, notification } from 'antd';
import CommonDashboardLayout from './CommonDashboardLayout';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import {
    DashboardOutlined,
    CarOutlined,
    HistoryOutlined,
    DollarOutlined,
    UserOutlined,
    SettingOutlined
} from '@ant-design/icons';

const DeliveryLayout = () => {
    const socket = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        const handleDeliveryRequest = (data) => {
            const audio = new Audio('/assets/notification.mp3'); // Assuming file exists or fails silently
            audio.play().catch(e => console.log('Audio play failed'));

            Modal.confirm({
                title: 'New Delivery Request!',
                icon: <CarOutlined style={{ color: '#1890ff' }} />,
                content: (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Pickup From:</strong><br />
                            {data.pickup.name}<br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{data.pickup.address?.street}, {data.pickup.address?.city}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Deliver To:</strong><br />
                            <span style={{ fontSize: '13px' }}>{data.dropoff.street}, {data.dropoff.city}</span>
                        </div>
                        <div style={{ marginTop: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Order Value:</span>
                                <strong>ETB {data.totalAmount}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                                <span>Est. Earnings:</span>
                                <strong>ETB {data.earnings || '0.00'}</strong>
                            </div>
                        </div>
                    </div>
                ),
                okText: 'Accept Delivery',
                cancelText: 'Decline',
                onOk: async () => {
                    try {
                        const token = localStorage.getItem('token');
                        // We should use an configured client but axios directly here for speed
                        await axios.put('/api/delivery/accept',
                            { orderId: data.orderId },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        notification.success({
                            message: 'Order Accepted',
                            description: 'Head to the pickup location.'
                        });
                        navigate(`/delivery/details/${data.orderId}`);
                    } catch (error) {
                        console.error(error);
                        notification.error({
                            message: 'Failed to accept order',
                            description: error.response?.data?.message || 'Someone else may have accepted it.'
                        });
                    }
                }
            });
        };

        socket.on('delivery_request', handleDeliveryRequest);

        return () => {
            socket.off('delivery_request', handleDeliveryRequest);
        };
    }, [socket, navigate]);

    const menuItems = [
        {
            key: '/delivery/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/delivery/active', // Placeholder
            icon: <CarOutlined />,
            label: 'Active Deliveries',
        },
        {
            key: '/delivery/history',
            icon: <HistoryOutlined />,
            label: 'Delivery History',
        },
        {
            key: '/delivery/earnings',
            icon: <DollarOutlined />,
            label: 'Earnings',
        },
        {
            key: '/delivery/profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: '/delivery/settings',
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
