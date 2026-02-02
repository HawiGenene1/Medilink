import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Button, Typography, Tag, Space, Avatar, Empty, Spin, message, Badge, Tooltip } from 'antd';
import {
    InfoCircleOutlined,
    CloudServerOutlined,
    SecurityScanOutlined,
    ApiOutlined,
    DeleteOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    AlertOutlined
} from '@ant-design/icons';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;

const AdminNotifications = () => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getAdminNotifications();
            if (response.success) {
                setNotifications(response.data);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
            message.error('Failed to load system notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'critical':
            case 'error':
                return <AlertOutlined style={{ color: '#ff4d4f' }} />;
            case 'warning':
                return <SecurityScanOutlined style={{ color: '#faad14' }} />;
            case 'promotion':
                return <ApiOutlined style={{ color: '#1890ff' }} />;
            case 'order_update':
                return <CloudServerOutlined style={{ color: '#52c41a' }} />;
            default:
                return <InfoCircleOutlined style={{ color: '#bfbfbf' }} />;
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const response = await adminService.markAdminNotificationRead(id);
            if (response.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            message.error('Failed to update notification status');
        }
    };

    const handleClearAll = async () => {
        try {
            const response = await adminService.clearAllAdminNotifications();
            if (response.success) {
                setNotifications([]);
                message.success('Notifications cleared');
            }
        } catch (error) {
            message.error('Failed to clear notifications');
        }
    };

    return (
        <div className="admin-notifications fade-in" style={{ padding: '24px' }}>
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>System Notifications</Title>
                    <Text type="secondary">Real-time technical alerts, server logs, and platform activities.</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>Refresh</Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleClearAll}
                        disabled={notifications.length === 0}
                    >
                        Clear All
                    </Button>
                </Space>
            </div>

            <Card bordered={false} className="premium-card">
                {loading && notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                ) : notifications.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Space direction="vertical">
                                <Text type="secondary">No system notifications found</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>You're all caught up with system activities.</Text>
                            </Space>
                        }
                    />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    !item.isRead && (
                                        <Tooltip title="Mark as Validated">
                                            <Button
                                                type="text"
                                                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                                onClick={() => handleMarkAsRead(item._id)}
                                            />
                                        </Tooltip>
                                    )
                                ]}
                                style={{
                                    background: !item.isRead ? '#f0faff' : 'transparent',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    transition: 'all 0.3s ease',
                                    border: !item.isRead ? '1px solid #e6f7ff' : '1px solid transparent'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Badge dot={!item.isRead}>
                                            <Avatar
                                                icon={getIcon(item.type)}
                                                style={{
                                                    backgroundColor: !item.isRead ? '#ffffff' : '#f5f5f5',
                                                    color: 'inherit',
                                                    boxShadow: !item.isRead ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                                                }}
                                            />
                                        </Badge>
                                    }
                                    title={
                                        <Space>
                                            <Text strong style={{ color: !item.isRead ? '#1890ff' : 'rgba(0,0,0,0.85)' }}>
                                                {item.title}
                                            </Text>
                                            <Tag color={
                                                item.type === 'critical' ? 'red' :
                                                    item.type === 'warning' ? 'orange' :
                                                        'blue'
                                            }>
                                                {item.type.toUpperCase().replace('_', ' ')}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <div style={{ marginBottom: 4 }}>{item.message}</div>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {new Date(item.createdAt).toLocaleString()}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminNotifications;
