
import React from 'react';
import { Row, Col, Card, Progress, Statistic, Badge, List, Typography, Timeline } from 'antd';
import {
    CloudServerOutlined,
    DatabaseOutlined,
    ApiOutlined,
    FieldTimeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

const SystemMonitoring = () => {

    const metrics = [
        { title: 'API Uptime', value: '99.98%', status: 'success' },
        { title: 'Avg Response Time', value: '145ms', status: 'success' },
        { title: 'Active Sessions', value: '1,240', status: 'processing' },
        { title: 'Error Rate', value: '0.02%', status: 'success' },
    ];

    const services = [
        { name: 'Primary Database (MongoDB)', status: 'Operational', icon: <DatabaseOutlined /> },
        { name: 'Backend API Gateway', status: 'Operational', icon: <ApiOutlined /> },
        { name: 'Notification Service', status: 'Operational', icon: <CloudServerOutlined /> },
        { name: 'Payment Processing', status: 'Degraded Performance', icon: <WarningOutlined />, type: 'warning' },
        { name: 'CDN / Static Assets', status: 'Operational', icon: <CloudServerOutlined /> },
    ];

    const trafficData = Array.from({ length: 20 }).map((_, i) => ({
        name: `${i}:00`,
        requests: Math.floor(Math.random() * 5000) + 2000,
    }));

    return (
        <div className="system-monitoring-page">
            <Title level={2}>System Status & Health</Title>

            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {metrics.map((item, index) => (
                    <Col key={index} xs={24} sm={12} lg={6}>
                        <Card bordered={false}>
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
                    <Card title="Live Traffic (Requests per Minute)" bordered={false} style={{ marginBottom: 24 }}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="requests" stroke="#1890ff" fillOpacity={1} fill="url(#colorRequests)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Server Resources" bordered={false}>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Text strong>CPU Usage (Core 1-8)</Text>
                                <Progress percent={45} status="active" strokeColor="#1890ff" />
                                <Progress percent={32} status="active" strokeColor="#1890ff" />
                                <Progress percent={68} status="active" strokeColor="#faad14" />
                                <Progress percent={41} status="active" strokeColor="#1890ff" />
                            </Col>
                            <Col span={12}>
                                <Text strong>Memory Usage (Ram)</Text>
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Progress type="dashboard" percent={72} strokeColor="#1890ff" />
                                    <div style={{ marginTop: 8 }}>12GB / 16GB Used</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Service Health */}
                <Col xs={24} lg={8}>
                    <Card title="Service Health" bordered={false} style={{ marginBottom: 24 }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={services}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<div style={{ fontSize: 24, color: '#1890ff' }}>{item.icon}</div>}
                                        title={item.name}
                                        description={
                                            <Badge status={item.type === 'warning' ? 'warning' : 'success'} text={item.status} />
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Card title="Recent Incidents" bordered={false}>
                        <Timeline
                            items={[
                                { color: 'green', children: 'System maintenance completed (2h ago)' },
                                { color: 'red', children: 'Database latency spike detected (Yesterday)' },
                                { color: 'blue', children: 'New deployment v2.1.0 (2 days ago)' },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemMonitoring;
