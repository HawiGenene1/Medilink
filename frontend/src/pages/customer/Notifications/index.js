import React, { useState } from 'react';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Tabs, Badge } from 'antd';
import {
    BellOutlined,
    ShoppingCartOutlined,
    FileProtectOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    MailOutlined
} from '@ant-design/icons';
import './Notifications.css';

const { Title, Text } = Typography;

const Notifications = () => {
    // Mock Notifications Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'order',
            title: 'Order #ORD-1024 is out for delivery',
            desc: 'Your medicine is on its way with Samuel Girma.',
            time: '5 mins ago',
            read: false,
            icon: <ShoppingCartOutlined />,
            color: '#1E88E5'
        },
        {
            id: 2,
            type: 'presc',
            title: 'Prescription Verified',
            desc: 'Your amoxicillin_rx_jan.pdf has been verified by the pharmacist.',
            time: '2 hours ago',
            read: false,
            icon: <FileProtectOutlined />,
            color: '#43A047'
        },
        {
            id: 3,
            type: 'system',
            title: 'New Pharmacy in your area',
            desc: 'Bethel Pharmacy is now available on MediLink.',
            time: '1 day ago',
            read: true,
            icon: <InfoCircleOutlined />,
            color: '#FFB300'
        },
        {
            id: 4,
            type: 'order',
            title: 'Previous Order Delivered',
            desc: 'Your order from City Central Pharma was delivered successfully.',
            time: '2 days ago',
            read: true,
            icon: <CheckCircleOutlined />,
            color: '#43A047'
        }
    ]);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const NotificationItem = ({ item }) => (
        <List.Item
            className={`notification-item ${item.read ? 'read' : 'unread'}`}
            actions={[
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteNotification(item.id)} />
            ]}
        >
            <List.Item.Meta
                avatar={
                    <Badge dot={!item.read} color="red" offset={[-2, 32]}>
                        <Avatar
                            icon={item.icon}
                            style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}
                            size={48}
                        />
                    </Badge>
                }
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text strong style={{ fontSize: '15px' }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>
                    </div>
                }
                description={<Text type="secondary" style={{ fontSize: '14px' }}>{item.desc}</Text>}
            />
        </List.Item>
    );

    const tabItems = [
        {
            key: '1',
            label: <span>All <Badge count={notifications.filter(n => !n.read).length} size="small" /></span>,
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    renderItem={item => <NotificationItem item={item} />}
                />
            )
        },
        {
            key: '2',
            label: 'Orders',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications.filter(n => n.type === 'order')}
                    renderItem={item => <NotificationItem item={item} />}
                />
            )
        },
        {
            key: '3',
            label: 'System',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications.filter(n => n.type === 'system')}
                    renderItem={item => <NotificationItem item={item} />}
                />
            )
        }
    ];

    return (
        <div className="notifications-page fade-in">
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Notifications</Title>
                    <Text type="secondary">Stay updated with your clinical orders and account activity.</Text>
                </div>
                <Space>
                    <Button icon={<MailOutlined />} onClick={markAllRead}>Mark all as read</Button>
                </Space>
            </div>

            <Card variant="borderless" className="notifications-card">
                <Tabs defaultActiveKey="1" className="noti-tabs" items={tabItems} />
            </Card>

            {notifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <BellOutlined style={{ fontSize: '64px', color: '#E2E8F0', marginBottom: '16px' }} />
                    <Title level={4} type="secondary">No notifications yet</Title>
                    <Text type="secondary">We'll let you know when something important happens.</Text>
                </div>
            )}
        </div>
    );
};

export default Notifications;
