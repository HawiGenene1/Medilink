import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Typography, Statistic, message, Spin } from 'antd';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import api from '../../../services/api';

const { Title } = Typography;
const { Option } = Select;

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        orderVolume: 0,
        avgOrderValue: 0,
        activeUsers: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orderRes, userRes] = await Promise.all([
                api.get(`/admin/analytics/orders?period=${period}`),
                api.get(`/admin/analytics/users?period=${period}`)
            ]);

            if (orderRes.data.success) {
                const { revenueTrends, statusDistribution: statusData, orderTrends } = orderRes.data.data;

                setRevenueTrend(revenueTrends.map(item => ({
                    name: item._id,
                    value: item.revenue
                })));

                setStatusDistribution(statusData.map(item => ({
                    name: item._id.toUpperCase(),
                    value: item.count
                })));

                const totalRev = revenueTrends.reduce((acc, curr) => acc + curr.revenue, 0);
                const totalOrders = orderTrends.reduce((acc, curr) => acc + curr.count, 0);

                setStats(prev => ({
                    ...prev,
                    totalRevenue: totalRev,
                    orderVolume: totalOrders,
                    avgOrderValue: totalOrders > 0 ? totalRev / totalOrders : 0
                }));
            }

            if (userRes.data.success) {
                setStats(prev => ({
                    ...prev,
                    activeUsers: userRes.data.data.activeUsers
                }));
            }
        } catch (error) {
            console.error('Analytics Fetch Error:', error);
            message.error('Failed to load business intelligence data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading && revenueTrend.length === 0) {
        return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="Analyzing data..." /></div>;
    }

    return (
        <div className="analytics-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Business Intelligence</Title>
                <Select value={period} style={{ width: 120 }} onChange={value => setPeriod(value)}>
                    <Option value="7d">Last 7 Days</Option>
                    <Option value="30d">Last 30 Days</Option>
                    <Option value="90d">Last 90 Days</Option>
                </Select>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card bordered={false} loading={loading}>
                        <Statistic
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix="ETB"
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} loading={loading}>
                        <Statistic
                            title="Order Volume"
                            value={stats.orderVolume}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} loading={loading}>
                        <Statistic
                            title="Avg Order Value"
                            value={stats.avgOrderValue}
                            precision={2}
                            prefix="ETB"
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} loading={loading}>
                        <Statistic
                            title="Active Users"
                            value={stats.activeUsers}
                            prefix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Revenue Trend" bordered={false} loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={revenueTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`ETB ${value.toFixed(2)}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="value" stroke="#1890ff" fill="#e6f7ff" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Order Status Distribution" bordered={false} loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend 
                                        layout="horizontal" 
                                        verticalAlign="bottom" 
                                        align="center"
                                        iconType="circle"
                                        wrapperStyle={{
                                            paddingTop: '20px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            lineHeight: '24px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Analytics;
