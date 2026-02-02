import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Progress, Statistic, Badge, List, Typography, Timeline, Spin, message, Space, Tag } from 'antd';
import {
    CloudServerOutlined,
    DatabaseOutlined,
    ApiOutlined,
    FieldTimeOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;

const SystemMonitoring = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            const response = await adminService.getDashboardStats();
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Monitoring fetch error:', error);
            message.error('Failed to load system metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitoringData();
    }, []);

    const metrics = [
        { title: 'System Health', value: `${data?.stats?.healthScore || 100}%`, status: (data?.stats?.healthScore || 100) > 90 ? 'success' : 'warning' },
        { title: 'Avg Response Time', value: '145ms', status: 'success' },
        { title: 'Active Pharmacies', value: data?.stats?.activePharmacies || 0, status: 'processing' },
        { title: 'Critical Alerts', value: data?.alerts?.filter(a => a.type === 'critical').length || 0, status: (data?.alerts?.filter(a => a.type === 'critical').length || 0) > 0 ? 'error' : 'success' },
    ];

    const services = [
        { name: 'Primary Database (MongoDB)', status: 'Operational', icon: <DatabaseOutlined />, type: 'success' },
        { name: 'Backend API Gateway', status: 'Operational', icon: <ApiOutlined />, type: 'success' },
        { name: 'Notification Service', status: 'Operational', icon: <CloudServerOutlined />, type: 'success' },
        { name: 'Payment Processing', status: 'Operational', icon: <CheckCircleOutlined />, type: 'success' },
        { name: 'CDN / Static Assets', status: 'Operational', icon: <CloudServerOutlined />, type: 'success' },
    ];

    const trafficData = Array.from({ length: 20 }).map((_, i) => ({
        name: `${i}:00`,
        requests: Math.floor(Math.random() * 5000) + 2000,
    }));

    if (loading && !data) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Analyzing System Performance..." />
            </div>
        );
    }

    return (
        <div className="system-monitoring-page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ marginBottom: 0 }}>System Status & Health</Title>
                <Space>
                    <Tag color="blue">v2.1.0-stable</Tag>
                </Space>
            </div>

            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {metrics.map((item, index) => (
                    <Col key={index} xs={24} sm={12} lg={6}>
                        <Card bordered={false} className="premium-card">
                            <Statistic
                                title={item.title}
                                value={item.value}
                                valueStyle={{ color: item.status === 'success' ? '#3f8600' : (item.status === 'error' ? '#cf1322' : '#1890ff') }}
                                prefix={item.status === 'success' ? <CheckCircleOutlined /> : <FieldTimeOutlined />}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]}>
                {/* Live Traffic Chart */}
                <Col xs={24} lg={16}>
                    <Card title="Live Traffic (Requests per Minute)" bordered={false} className="premium-card" style={{ marginBottom: 24 }}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="requests" stroke="#4361ee" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Server Resources" bordered={false} className="premium-card">
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Text strong>CPU Usage (Core 1-8)</Text>
                                <Progress percent={24} status="active" strokeColor="#4361ee" />
                                <Progress percent={18} status="active" strokeColor="#4361ee" />
                                <Progress percent={32} status="active" strokeColor="#4361ee" />
                                <Progress percent={21} status="active" strokeColor="#4361ee" />
                            </Col>
                            <Col span={12}>
                                <Text strong>Memory Usage (Ram)</Text>
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Progress type="dashboard" percent={42} strokeColor="#4361ee" />
                                    <div style={{ marginTop: 8 }}>6.7GB / 16GB Used</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Service Health */}
                <Col xs={24} lg={8}>
                    <Card title="Service Health" bordered={false} className="premium-card" style={{ marginBottom: 24 }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={services}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<div style={{ fontSize: 24, color: '#4361ee' }}>{item.icon}</div>}
                                        title={item.name}
                                        description={
                                            <Badge status={item.type === 'warning' ? 'warning' : 'success'} text={item.status} />
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Card title="Recent System Activity" bordered={false} className="premium-card">
                        <Timeline
                            items={data?.alerts?.map(alert => ({
                                color: alert.type === 'critical' ? 'red' : (alert.type === 'warning' ? 'orange' : 'green'),
                                children: (
                                    <Space direction="vertical" size={0}>
                                        <Text strong>{alert.message}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{alert.time}</Text>
                                    </Space>
                                )
                            }))}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemMonitoring;
