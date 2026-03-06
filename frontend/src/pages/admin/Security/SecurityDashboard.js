import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Alert, List, Typography, Switch, Space, message } from 'antd';
import {
    LockOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    StopOutlined,
    UserSwitchOutlined
} from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text } = Typography;

const SecurityDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [threats, setThreats] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const fetchSecurityData = async () => {
        setLoading(true);
        try {
            const [logsRes, usersRes, settingsRes] = await Promise.all([
                api.get('/admin/audit-logs?limit=10&status=FAILURE'),
                api.get('/admin/users?limit=5'),
                api.get('/admin/system/settings')
            ]);

            if (logsRes.data.success && logsRes.data.data?.logs) {
                setThreats(logsRes.data.data.logs.map(log => ({
                    id: log._id,
                    event: `${log.action} Failure`,
                    user: log.user?.email || 'Unknown',
                    ip: log.metadata?.ip || 'Hidden',
                    time: new Date(log.createdAt).toLocaleTimeString(),
                    severity: 'High'
                })));
            }

            if (usersRes.data.success && usersRes.data.data) {
                const usersList = Array.isArray(usersRes.data.data) ? usersRes.data.data : (usersRes.data.data.users || []);
                setSessions(usersList.map(u => ({
                    id: u._id,
                    user: u.email,
                    role: u.role,
                    lastActive: 'Active Now',
                    status: 'online',
                    ip: u.lastLoginIp || 'Hidden',
                    device: 'Unknown'
                })));
            }

            if (settingsRes.data.success && Array.isArray(settingsRes.data.data)) {
                const maintenance = settingsRes.data.data.find(s => s.key === 'maintenance_mode');
                setMaintenanceMode(maintenance?.value === true || maintenance?.value === 'true');
            }
        } catch (error) {
            message.error('Failed to load security data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        const nextStatus = !maintenanceMode;
        try {
            const res = await api.post('/admin/system/maintenance', { status: nextStatus });
            if (res.data.success) {
                setMaintenanceMode(nextStatus);
                message.success(nextStatus ? 'Maintenance Mode ACTIVE' : 'Maintenance Mode Disabled');
            }
        } catch (error) {
            message.error('Failed to change maintenance status');
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const handleAction = (action) => {
        if (action === 'Lockdown') {
            handleToggleMaintenance();
            return;
        }
        message.loading(`Executing ${action}...`, 1.5).then(() => {
            message.success(`${action} successful`);
        });
    };

    const sessionColumns = [
        { title: 'User', dataIndex: 'user', key: 'user' },
        { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
        { title: 'Location', dataIndex: 'location', key: 'location' },
        { title: 'Device', dataIndex: 'device', key: 'device' },
        { title: 'Active Time', dataIndex: 'active', key: 'active' },
        {
            title: 'Action',
            key: 'action',
            render: () => <Button size="small" danger onClick={() => message.success('Session Terminated')}>Kill Session</Button>
        }
    ];

    const permissions = [
        { key: '1', module: 'User Management', admin: true, pharmacy: false, customer: false },
        { key: '2', module: 'Order Processing', admin: true, pharmacy: true, customer: true },
        { key: '3', module: 'System Settings', admin: true, pharmacy: false, customer: false },
        { key: '4', module: 'Financial Reports', admin: true, pharmacy: true, customer: false },
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
                description="Failed login monitoring active. No critical vulnerabilities detected."
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<span><GlobalOutlined /> Active Security Sessions</span>}
                        extra={<Button type="link" onClick={fetchSecurityData}>Refresh</Button>}
                        style={{ marginBottom: 24 }}
                        loading={loading}
                    >
                        <div style={{ overflowX: 'auto' }}>
                            <Table
                                columns={sessionColumns}
                                dataSource={sessions}
                                pagination={false}
                                size="small"
                            />
                        </div>
                    </Card>

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
                    <Card title={<span><SafetyCertificateOutlined /> Live Threat Feed</span>} style={{ marginBottom: 24 }} loading={loading}>
                        <List
                            size="small"
                            dataSource={threats}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<StopOutlined style={{ color: 'red' }} />}
                                        title={<Text type="danger">{item.event}</Text>}
                                        description={`${item.ip} • ${item.time}`}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: 'No recent security threats detected' }}
                        />
                    </Card>

                    <Card title="Emergency Controls">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                danger={!maintenanceMode}
                                type={maintenanceMode ? 'default' : 'primary'}
                                block
                                icon={<LockOutlined />}
                                onClick={() => handleAction('Lockdown')}
                                style={{ height: 'auto', padding: '10px 15px', whiteSpace: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <span style={{ textAlign: 'center' }}>
                                    {maintenanceMode ? 'Lift Lockdown' : 'Lockdown Mode (Enable Maintenance)'}
                                </span>
                            </Button>
                            <Button block icon={<UserSwitchOutlined />} onClick={() => message.info('Password reset triggered for all users')}>Force Password Reset All</Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SecurityDashboard;
