import React from 'react';
import { Card, List, Avatar, Typography, Button, Space, Tag, Empty } from 'antd';
import {
    BellOutlined,
    ShoppingOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '../../../contexts/NotificationContext';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const OwnerNotifications = () => {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <ShoppingOutlined style={{ color: '#1890ff' }} />;
            case 'alert': return <InfoCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'system': return <BellOutlined style={{ color: '#722ed1' }} />;
            default: return <BellOutlined />;
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>Notifications</Title>
                    <Text type="secondary">Stay updated with your pharmacy status</Text>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button onClick={markAllAsRead}>Mark all as read</Button>
                )}
            </div>

            <Card bordered={false}>
                {notifications.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    !item.read && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => markAsRead(item.id)}
                                        >
                                            Mark read
                                        </Button>
                                    )
                                ]}
                                style={{
                                    background: item.read ? 'transparent' : '#f0faff',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            icon={getIcon(item.type)}
                                            style={{ backgroundColor: item.read ? '#f0f0f0' : '#e6f7ff' }}
                                        />
                                    }
                                    title={
                                        <Space>
                                            <Text strong={!item.read}>{item.title}</Text>
                                            {!item.read && <Tag color="blue" style={{ fontSize: '10px' }}>NEW</Tag>}
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <Paragraph style={{ margin: 0 }} type="secondary">{item.description}</Paragraph>
                                            <Space size="small" style={{ marginTop: 4 }}>
                                                <ClockCircleOutlined style={{ fontSize: '12px', color: '#bfbfbf' }} />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {dayjs(item.timestamp).fromNow()}
                                                </Text>
                                            </Space>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="No notifications" />
                )}
            </Card>
        </div>
    );
};

export default OwnerNotifications;
