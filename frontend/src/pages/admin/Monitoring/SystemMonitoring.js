import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Progress, Statistic, Badge, List, Typography, Timeline, Space, message } from 'antd';
import {
    CloudServerOutlined,
    DatabaseOutlined,
    ApiOutlined,
    FieldTimeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

const { Title, Text } = Typography;

const SystemMonitoring = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchHealth = async () => {
        try {
            const response = await api.get('/admin/monitoring/health');
            if (response.data.success) {
                setData(response.data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Fetch monitoring error:', error);
            message.error('Failed to update system metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const performance = data?.performance || {};

    // Format memory usage data
    const memoryUsed = performance.memoryUsage ? Math.round(performance.memoryUsage.rss / 1024 / 1024) : 0;
    const memoryPercent = Math.min(Math.round((memoryUsed / 1024) * 100), 100); // Assuming 1GB soft limit for visualization if unknown

    const metrics = [
        { title: 'API Uptime', value: `${performance.uptime || 0}s`, status: 'success' },
        { title: 'Avg Response Time', value: `${performance.avgResponseTime || 0}ms`, status: performance.avgResponseTime < 500 ? 'success' : 'warning' },
        { title: 'Active Sessions', value: performance.activeRequests || 0, status: 'processing' },
        { title: 'Error Rate', value: `${performance.errorRate || 0}%`, status: performance.errorRate < 1 ? 'success' : 'error' },
    ];

    const servicesList = [
        { name: 'Primary Database (MongoDB)', status: data?.database?.status === 'healthy' ? 'Operational' : 'Down', icon: <DatabaseOutlined />, type: data?.database?.status === 'healthy' ? 'success' : 'error' },
        { name: 'Backend API Gateway', status: data?.services?.authentication === 'healthy' ? 'Operational' : 'Issues', icon: <ApiOutlined />, type: 'success' },
        { name: 'Notification Service', status: 'Operational', icon: <CloudServerOutlined />, type: 'success' },
        { name: 'Email Service', status: data?.services?.emailService === 'healthy' ? 'Operational' : 'Issues', icon: <CloudServerOutlined />, type: 'success' },
    ];

    return (
        <div className="system-monitoring-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>System Status & Health</Title>
                <Space>
                    <Text type="secondary">Last updated: {lastUpdated.toLocaleTimeString()}</Text>
                    <Badge status="processing" text="Live Polling" />
                </Space>
            </div>

            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {metrics.map((item, index) => (
                    <Col key={index} xs={24} sm={12} lg={6}>
                        <Card bordered={false} loading={loading}>
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
                    <Card
                        title="Live Traffic (Requests per Minute)"
                        bordered={false}
                        style={{ marginBottom: 24 }}
                        extra={<Text type="secondary">Current: {performance.requestsPerMinute || 0} RPM</Text>}
                    >
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={performance.trafficData || []}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="requests" stroke="#1890ff" fillOpacity={1} fill="url(#colorRequests)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Server Resources" bordered={false} loading={loading}>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Text strong>Processes & Node</Text>
                                <div style={{ marginTop: 16 }}>
                                    <Text block>Node Version: {performance.nodeVersion}</Text>
                                    <Text block>Total Requests: {performance.totalRequests}</Text>
                                    <Text block>Active Tasks: {performance.activeRequests}</Text>
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text strong>Memory Usage (RSS)</Text>
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Progress type="dashboard" percent={memoryPercent} strokeColor={memoryPercent > 80 ? '#cf1322' : '#1890ff'} />
                                    <div style={{ marginTop: 8 }}>{memoryUsed}MB Used</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Service Health */}
                <Col xs={24} lg={8}>
                    <Card title="Service Status" bordered={false} style={{ marginBottom: 24 }} loading={loading}>
                        <List
                            itemLayout="horizontal"
                            dataSource={servicesList}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<div style={{ fontSize: 24, color: item.type === 'error' ? '#cf1322' : '#1890ff' }}>{item.icon}</div>}
                                        title={item.name}
                                        description={
                                            <Badge status={item.type} text={item.status} />
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Card title="Platform Information" bordered={false}>
                        <Timeline
                            items={[
                                { color: 'green', children: `Uptime Tracking Active` },
                                { color: 'blue', children: `Monitoring Engine v1.0.0` },
                                { color: 'gray', children: `Connected from ${window.location.hostname}` },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemMonitoring;
