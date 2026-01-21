
import React from 'react';
import { Row, Col, Card, Select, Typography, Statistic } from 'antd';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const Analytics = () => {

    const monthlyRevenue = [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 2000 },
        { name: 'Apr', value: 2780 },
        { name: 'May', value: 1890 },
        { name: 'Jun', value: 2390 },
        { name: 'Jul', value: 3490 },
    ];

    const categoryData = [
        { name: 'Antibiotics', value: 400 },
        { name: 'Pain Relief', value: 300 },
        { name: 'Supplements', value: 300 },
        { name: 'Chronic Care', value: 200 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="analytics-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Business Intelligence</Title>
                <Select defaultValue="this_year" style={{ width: 120 }}>
                    <Option value="this_month">This Month</Option>
                    <Option value="this_quarter">This Quarter</Option>
                    <Option value="this_year">This Year</Option>
                </Select>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Revenue"
                            value={112893}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix="ETB"
                            suffix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Order Volume"
                            value={982}
                            valueStyle={{ color: '#3f8600' }}
                            suffix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Avg Order Value"
                            value={112}
                            precision={2}
                            prefix="ETB"
                            valueStyle={{ color: '#cf1322' }}
                            suffix={<ArrowDownOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Active Users"
                            value={4503}
                            prefix=<ArrowUpOutlined />
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Revenue Trend" bordered={false}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Sales by Category" bordered={false}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
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
