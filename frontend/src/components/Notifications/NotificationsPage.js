import React from 'react';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Tabs, Badge } from 'antd';
import {
    BellOutlined,
    ShoppingCartOutlined,
    FileProtectOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    MailOutlined,
    UserOutlined,
    TagOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationsPage.css';

const { Title, Text } = Typography;

const NotificationsPage = ({ role = 'user' }) => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        deleteNotification
    } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'order_update': return <ShoppingCartOutlined />;
            case 'presc': return <FileProtectOutlined />;
            case 'account': return <UserOutlined />;
            case 'promotion': return <TagOutlined />;
            case 'system': return <InfoCircleOutlined />;
            default: return <BellOutlined />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'order_update': return '#1E88E5';
            case 'presc': return '#10B981';
            case 'account': return '#8B5CF6';
            case 'promotion': return '#EC4899';
            case 'system': return '#F59E0B';
            default: return '#64748B';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMin = Math.round(diffMs / 60000);
        const diffHr = Math.round(diffMs / 3600000);
        const diffDay = Math.round(diffMs / 86400000);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return past.toLocaleDateString();
    };

    const NotificationItem = ({ item }) => (
        <List.Item
            className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
            onClick={() => !item.isRead && markAsRead(item.id || item._id)}
            style={{ cursor: item.isRead ? 'default' : 'pointer' }}
            actions={[
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id || item._id);
                    }}
                />
            ]}
        >
            <List.Item.Meta
                avatar={
                    <Badge dot={!item.isRead} color="red" offset={[-2, 32]}>
                        <Avatar
                            icon={getIcon(item.type)}
                            style={{
                                backgroundColor: `${getColor(item.type)}15`,
                                color: getColor(item.type),
                                border: `1px solid ${getColor(item.type)}30`
                            }}
                            size={48}
                        />
                    </Badge>
                }
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text strong style={{ fontSize: '15px' }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{formatTime(item.createdAt)}</Text>
                    </div>
                }
                description={
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text type="secondary" style={{ fontSize: '14px' }}>{item.message}</Text>
                        {item.link && (
                            <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, width: 'fit-content', marginTop: '4px' }}
                                onClick={(e) => { e.stopPropagation(); window.location.href = item.link; }}
                            >
                                View Details
                            </Button>
                        )}
                    </div>
                }
            />
        </List.Item>
    );

    const tabItems = [
        {
            key: '1',
            label: <span>All <Badge count={unreadCount} size="small" offset={[10, -5]} /></span>,
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
            label: 'Activity',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications.filter(n => ['order_update', 'promotion'].includes(n.type))}
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
                    dataSource={notifications.filter(n => ['system', 'account'].includes(n.type))}
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
                    <Text type="secondary">Manage your updates and activity.</Text>
                </div>
                <Space>
                    <Button icon={<MailOutlined />} onClick={markAllRead}>Mark all read</Button>
                </Space>
            </div>

            <Card bordered={false} className="notifications-card">
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

export default NotificationsPage;
