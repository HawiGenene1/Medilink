import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Tag, Space, Typography, Empty, Spin, Button } from 'antd';
import {
    BellOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import pharmacyAdminService from '../../../services/pharmacyAdminService';

const { Title, Text } = Typography;

const PharmacyAdminNotifications = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await pharmacyAdminService.getAlerts();
            if (response.success) {
                setAlerts(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'error':
                return <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
            case 'warning':
                return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />;
            case 'info':
                return <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
            default:
                return <BellOutlined style={{ fontSize: 20 }} />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'processing';
            default:
                return 'default';
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2}>Notification</Title>
                    <Text type="secondary">Platform alerts and important updates</Text>
                </div>
                <Button icon={<CheckCircleOutlined />} onClick={fetchAlerts}>
                    Refresh
                </Button>
            </div>

            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <Spin size="large" />
                    </div>
                ) : alerts.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No notifications at this time"
                        style={{ padding: '48px' }}
                    />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={alerts}
                        renderItem={(alert) => (
                            <List.Item
                                style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    background: alert.severity === 'error' ? '#fff1f0' :
                                        alert.severity === 'warning' ? '#fffbe6' : '#f0f5ff'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={getSeverityIcon(alert.severity)}
                                    title={
                                        <Space>
                                            <Text strong>{alert.message}</Text>
                                            <Tag color={getSeverityColor(alert.severity)}>
                                                {alert.type.replace(/_/g, ' ').toUpperCase()}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        alert.details && (
                                            <div style={{ marginTop: '8px' }}>
                                                {Array.isArray(alert.details) && alert.details.slice(0, 3).map((detail, idx) => (
                                                    <div key={idx} style={{ marginTop: '4px' }}>
                                                        <Text type="secondary">
                                                            • {detail.pharmacy || detail.pharmacyName}: {
                                                                detail.expiryDate ?
                                                                    new Date(detail.expiryDate).toLocaleDateString() :
                                                                    detail.endDate ?
                                                                        new Date(detail.endDate).toLocaleDateString() :
                                                                        ''
                                                            }
                                                        </Text>
                                                    </div>
                                                ))}
                                                {alert.details.length > 3 && (
                                                    <Text type="secondary">... and {alert.details.length - 3} more</Text>
                                                )}
                                            </div>
                                        )
                                    }
                                />
                                <Badge count={alert.count} style={{ backgroundColor: '#1890ff' }} />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};

export default PharmacyAdminNotifications;
