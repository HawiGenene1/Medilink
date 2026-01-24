import React from 'react';
import { Card, Alert, List, Badge, Empty, Tag } from 'antd';
import {
    WarningOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    StopOutlined
} from '@ant-design/icons';

const AlertsWidget = ({ alerts = [] }) => {
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high':
                return <WarningOutlined style={{ color: '#ff4d4f' }} />;
            case 'medium':
                return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
            default:
                return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            default:
                return 'info';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'low_stock':
            case 'out_of_stock':
                return <StopOutlined />;
            case 'expiring_soon':
                return <ClockCircleOutlined />;
            default:
                return <InfoCircleOutlined />;
        }
    };

    if (!alerts || alerts.length === 0) {
        return (
            <Card title="Alerts & Notifications" style={{ height: '100%' }}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No alerts at this time"
                />
            </Card>
        );
    }

    return (
        <Card
            title={
                <span>
                    Alerts & Notifications
                    <Badge count={alerts.length} style={{ marginLeft: '12px' }} />
                </span>
            }
            style={{ height: '100%' }}
        >
            <List
                dataSource={alerts.slice(0, 5)}
                renderItem={(alert) => (
                    <List.Item>
                        <Alert
                            message={
                                <span>
                                    {getTypeIcon(alert.type)} {alert.message}
                                </span>
                            }
                            type={getSeverityColor(alert.severity)}
                            showIcon
                            icon={getSeverityIcon(alert.severity)}
                            style={{ width: '100%' }}
                            banner
                        />
                    </List.Item>
                )}
            />
            {alerts.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '12px', color: '#888' }}>
                    +{alerts.length - 5} more alerts
                </div>
            )}
        </Card>
    );
};

export default AlertsWidget;
