
import React from 'react';
import { Row, Col, Card, Table, Tag, Button, Alert, List, Typography, Switch, Space } from 'antd';
import {
    LockOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    StopOutlined,
    UserSwitchOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const SecurityDashboard = () => {

    // Mock Active Sessions
    const sessions = [
        { key: 1, user: 'Admin User', ip: '192.168.1.10', location: 'Addis Ababa', device: 'Chrome / Windows', active: '2 mins' },
        { key: 2, user: 'Pharmacy Owner A', ip: '10.0.0.5', location: 'Debre Zeyit', device: 'Safari / iPhone', active: '15 mins' },
        { key: 3, user: 'Store Manager', ip: '172.16.0.2', location: 'Adama', device: 'Firefox / Linux', active: '1 hour' },
    ];

    const sessionColumns = [
        { title: 'User', dataIndex: 'user', key: 'user' },
        { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
        { title: 'Location', dataIndex: 'location', key: 'location' },
        { title: 'Device', dataIndex: 'device', key: 'device' },
        { title: 'Active Time', dataIndex: 'active', key: 'active' },
        {
            title: 'Action',
            key: 'action',
            render: () => <Button size="small" danger>Kill Session</Button>
        }
    ];

    const permissions = [
        { module: 'User Management', admin: true, pharmacy: false, customer: false },
        { module: 'Order Processing', admin: true, pharmacy: true, customer: true },
        { module: 'System Settings', admin: true, pharmacy: false, customer: false },
        { module: 'Financial Reports', admin: true, pharmacy: true, customer: false },
    ];

    const permissionColumns = [
        { title: 'Module / Resource', dataIndex: 'module', key: 'module' },
        { title: 'Administrator', dataIndex: 'admin', render: val => <Switch size="small" checked={val} disabled /> },
        { title: 'Pharmacy Owner', dataIndex: 'pharmacy', render: val => <Switch size="small" checked={val} disabled /> },
        { title: 'Customer', dataIndex: 'customer', render: val => <Switch size="small" checked={val} disabled /> },
    ];

    return (
        <div className="security-dashboard">
            <Title level={2}>Security & Access Control</Title>

            <Alert
                message="System Security Status: Secured"
                description="All firewalls active. No critical vulnerabilities detected in the last scan."
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    {/* Active Sessions */}
                    <Card
                        title={<span><GlobalOutlined /> Active Security Sessions</span>}
                        extra={<Button type="link">View All</Button>}
                        style={{ marginBottom: 24 }}
                    >
                        <Table
                            columns={sessionColumns}
                            dataSource={sessions}
                            pagination={false}
                            size="small"
                        />
                    </Card>

                    {/* Access Control Matrix */}
                    <Card title={<span><LockOutlined /> Role Permission Matrix</span>}>
                        <Table
                            columns={permissionColumns}
                            dataSource={permissions}
                            pagination={false}
                            bordered
                            size="small"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    {/* Threat Feed */}
                    <Card title={<span><SafetyCertificateOutlined /> Live Threat Feed</span>} style={{ marginBottom: 24 }}>
                        <List
                            size="small"
                            dataSource={[
                                { msg: 'Failed login attempt (root)', ip: '203.0.113.1', time: '1m ago' },
                                { msg: 'SQL Injection attempt blocked', ip: '45.33.22.11', time: '15m ago' },
                                { msg: 'Suspicious file upload detected', ip: '10.0.0.5', time: '1h ago' },
                            ]}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<StopOutlined style={{ color: 'red' }} />}
                                        title={<Text type="danger">{item.msg}</Text>}
                                        description={`${item.ip} • ${item.time}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Quick Actions */}
                    <Card title="Emergency Controls">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button danger block icon={<StopOutlined />}>Lockdown Mode</Button>
                            <Button block icon={<UserSwitchOutlined />}>Force Password Reset All</Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SecurityDashboard;
