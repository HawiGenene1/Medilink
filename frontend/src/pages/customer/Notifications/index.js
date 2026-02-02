import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, List, Avatar, Button, Space, Tabs, Badge, Spin, message, Empty, Tooltip } from 'antd';
import {
    BellOutlined,
    ShoppingCartOutlined,
    FileProtectOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    MailOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import notificationService from '../../../services/api/notifications';
import './Notifications.css';

const { Title, Text } = Typography;

const Notifications = () => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications();
            if (response.success) {
                setNotifications(response.data);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
            message.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            fetchNotifications();
            message.success('All notifications marked as read');
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            message.success('Notification removed');
        } catch (error) {
            message.error('Failed to remove notification');
        }
    };

    const handleClearAll = async () => {
        try {
            await notificationService.clearAll();
            setNotifications([]);
            message.success('Notifications cleared');
        } catch (error) {
            message.error('Failed to clear notifications');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order_update': return <ShoppingCartOutlined />;
            case 'promotion': return <InfoCircleOutlined />;
            case 'account': return <FileProtectOutlined />;
            default: return <BellOutlined />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'order_update': return '#1890ff';
            case 'promotion': return '#52c41a';
            case 'account': return '#faad14';
            default: return '#bfbfbf';
        }
    };

    const NotificationItem = ({ item }) => (
        <List.Item
            className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
            actions={[
                !item.isRead && (
                    <Tooltip title="Mark Read">
                        <Button type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} onClick={() => handleMarkRead(item._id)} />
                    </Tooltip>
                ),
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item._id)} />
            ]}
            style={{
                background: !item.isRead ? '#f0faff' : 'transparent',
                padding: '16px 24px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: !item.isRead ? '1px solid #e6f7ff' : '1px solid #f0f0f0'
            }}
        >
            <List.Item.Meta
                avatar={
                    <Badge dot={!item.isRead} color="red" offset={[-2, 32]}>
                        <Avatar
                            icon={getIcon(item.type)}
                            style={{
                                backgroundColor: !item.isRead ? '#ffffff' : '#f5f5f5',
                                color: getColor(item.type),
                                boxShadow: !item.isRead ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                            }}
                            size={48}
                        />
                    </Badge>
                }
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text strong style={{ fontSize: '15px', color: !item.isRead ? '#1890ff' : 'inherit' }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </div>
                }
                description={
                    <div>
                        <div style={{ fontSize: '14px', marginBottom: 4 }}>{item.message}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </div>
                }
            />
        </List.Item>
    );

    const tabItems = [
        {
            key: '1',
            label: <span>All <Badge count={notifications.filter(n => !n.read).length} size="small" offset={[5, -2]} /></span>,
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    renderItem={item => <NotificationItem item={item} />}
                    locale={{ emptyText: <Empty description="No notifications found" /> }}
                />
            )
        },
        {
            key: '2',
            label: 'Orders',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications.filter(n => n.type === 'order_update')}
                    renderItem={item => <NotificationItem item={item} />}
                    locale={{ emptyText: <Empty description="No order updates" /> }}
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
                    locale={{ emptyText: <Empty description="No system alerts" /> }}
                />
            )
        }
    ];

    return (
        <div className="notifications-page fade-in" style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Notifications</Title>
                    <Text type="secondary">Stay updated with your clinical orders and account activity.</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>Refresh</Button>
                    <Button icon={<MailOutlined />} onClick={handleMarkAllRead} disabled={notifications.every(n => n.isRead)}>Mark all as read</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={handleClearAll} disabled={notifications.length === 0}>Clear All</Button>
                </Space>
            </div>

            <Card bordered={false} className="premium-card">
                {loading && notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
                ) : (
                    <Tabs defaultActiveKey="1" className="noti-tabs" items={tabItems} />
                )}
            </Card>
        </div>
    );
};

export default Notifications;
