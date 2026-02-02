import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Typography, Statistic, Spin, message } from 'antd';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import Button from 'antd/es/button';
import adminService from '../../../services/api/admin';

const { Title } = Typography;
const { Option } = Select;

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminService.getDetailedAnalytics();
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
            message.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Loading Business Intelligence..." />
            </div>
        );
    }

    if (!data) return <div>No data available</div>;

    const { kpis, revenueTrend, categoryData } = data;

    return (
        <div className="analytics-page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ marginBottom: 0 }}>Business Intelligence</Title>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Select defaultValue="this_year" style={{ width: 150 }}>
                        <Option value="this_month">This Month</Option>
                        <Option value="this_quarter">This Quarter</Option>
                        <Option value="this_year">This Year</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchAnalytics}>Refresh</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card">
                        <Statistic
                            title="Total Revenue"
                            value={kpis.totalRevenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix="ETB "
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card">
                        <Statistic
                            title="Order Volume"
                            value={kpis.totalOrders}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card">
                        <Statistic
                            title="Avg Order Value"
                            value={kpis.avgOrderValue}
                            precision={2}
                            prefix="ETB "
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card">
                        <Statistic
                            title="Active Customers"
                            value={kpis.activeUsers}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Revenue Growth Trend" bordered={false} className="premium-card">
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <AreaChart data={revenueTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Sales by Category" bordered={false} className="premium-card">
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `ETB ${value.toFixed(2)}`} />
                                    <Legend verticalAlign="bottom" height={36} />
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
