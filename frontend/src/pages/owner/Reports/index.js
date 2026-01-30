import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Tag, Space, Divider, Progress } from 'antd';
import {
    BarChartOutlined,
    FallOutlined,
    RiseOutlined,
    DollarOutlined,
    ShoppingOutlined,
    TeamOutlined,
    CalendarOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const MOCK_SALES_TRENDS = [
    { key: '1', period: 'January 2026', revenue: 45200, orders: 1240, growth: 12.5 },
    { key: '2', period: 'December 2025', revenue: 40150, orders: 1120, growth: 8.2 },
    { key: '3', period: 'November 2025', revenue: 37100, orders: 1050, growth: -2.1 },
    { key: '4', period: 'October 2025', revenue: 38000, orders: 1080, growth: 4.5 },
];

const MOCK_STAFF_TRENDS = [
    { key: '1', period: 'January 2026', totalStaff: 12, newJoiners: 2, turnover: 0 },
    { key: '2', period: 'December 2025', totalStaff: 10, newJoiners: 1, turnover: 1 },
    { key: '3', period: 'November 2025', totalStaff: 10, newJoiners: 0, turnover: 0 },
];

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => {
        // Immediate load for mock data
        setLoading(false);
    }, []);

    const salesColumns = [
        {
            title: 'Month',
            dataIndex: 'period',
            key: 'period',
            render: (text) => <Space><CalendarOutlined /> {text}</Space>
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (val) => `$${val.toLocaleString()}`,
            sorter: (a, b) => a.revenue - b.revenue,
        },
        {
            title: 'Total Orders',
            dataIndex: 'orders',
            key: 'orders',
            render: (val) => val.toLocaleString(),
        },
        {
            title: 'Growth',
            dataIndex: 'growth',
            key: 'growth',
            render: (val) => (
                <Tag color={val >= 0 ? 'green' : 'red'} icon={val >= 0 ? <RiseOutlined /> : <FallOutlined />}>
                    {val > 0 ? '+' : ''}{val}%
                </Tag>
            ),
        }
    ];

    const staffColumns = [
        {
            title: 'Month',
            dataIndex: 'period',
            key: 'period',
        },
        {
            title: 'Total Staff',
            dataIndex: 'totalStaff',
            key: 'totalStaff',
            render: (val) => <Text strong>{val}</Text>,
        },
        {
            title: 'New Joiners',
            dataIndex: 'newJoiners',
            key: 'newJoiners',
            render: (val) => val > 0 ? <Tag color="blue">+{val}</Tag> : <Text type="secondary">0</Text>,
        },
        {
            title: 'Turnover',
            dataIndex: 'turnover',
            key: 'turnover',
            render: (val) => val > 0 ? <Tag color="volcano">{val} left</Tag> : <Text type="secondary">Stable</Text>,
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Space size="middle" align="center">
                    <Title level={2} style={{ marginBottom: 0 }}>Business Analytics & Reports</Title>
                    {isDev && <Tag color="orange">Mock Mode</Tag>}
                </Space>
                <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Track monthly performance, revenue growth, and workforce trends.</Text>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Total Annual Revenue"
                            value={485600}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<DollarOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="success"><ArrowUpOutlined /> 15% increase </Text>
                            <Text type="secondary">since last year</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Orders (Current Month)"
                            value={1240}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Progress percent={85} size="small" status="active" />
                            <Text type="secondary">85% of monthly target met</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Active Workforce"
                            value={12}
                            prefix={<TeamOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">2 departments added this year</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">Operational Performance</Divider>

            <Row gutter={[24, 24]}>
                <Col xs={24} xl={14}>
                    <Card title={<Space><BarChartOutlined /> Monthly Sales Summary</Space>} loading={loading}>
                        <Table
                            dataSource={MOCK_SALES_TRENDS}
                            columns={salesColumns}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>
                <Col xs={24} xl={10}>
                    <Card title={<Space><TeamOutlined /> Staff Count Trend</Space>} loading={loading}>
                        <Table
                            dataSource={MOCK_STAFF_TRENDS}
                            columns={staffColumns}
                            pagination={false}
                            size="middle"
                        />
                        <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                            <Title level={5}>Retention Insights</Title>
                            <Paragraph>
                                Your workforce has grown by <b>20%</b> in the last quarter. Turnover remains significantly lower than industry average.
                            </Paragraph>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Reports;
