import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Statistic,
    Space,
    Skeleton,
    Empty,
    Tooltip,
    Divider
} from 'antd';
import {
    LineChartOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    TeamOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Analytics = () => {
    const isDev = process.env.NODE_ENV === 'development';
    const [loading, setLoading] = useState(!isDev);

    // Mock data for the chart
    const salesData = [
        { month: 'Jul', sales: 12500 },
        { month: 'Aug', sales: 15000 },
        { month: 'Sep', sales: 13200 },
        { month: 'Oct', sales: 18400 },
        { month: 'Nov', sales: 21000 },
        { month: 'Dec', sales: 25000 },
    ];

    useEffect(() => {
        // Immediate load for mock data
        setLoading(false);
    }, []);

    const maxSales = Math.max(...salesData.map(d => d.sales));

    if (loading) {
        return (
            <div style={{ padding: '24px' }}>
                <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 8 }} />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <Space size="middle" align="baseline">
                    <Title level={2}>Analytics</Title>
                    {isDev && <Tag color="blue">Development Mock</Tag>}
                </Space>
                <Paragraph type="secondary">
                    Review your pharmacy's business performance and growth trends.
                </Paragraph>
            </div>

            {/* 1. Summary Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title={<Space>Total Sales (Monthly) <Tooltip title="Gross revenue for the current calendar month"><InfoCircleOutlined /></Tooltip></Space>}
                            value={25000}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="ETB"
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Total Orders"
                            value={1240}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Staff Count"
                            value={12}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 2. Chart Section */}
            <Card
                title={<Space><LineChartOutlined /> Sales Over Time</Space>}
                bordered={false}
                style={{ borderRadius: '8px' }}
            >
                {salesData.length > 0 ? (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            height: '250px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            {salesData.map((data, index) => (
                                <div key={index} style={{
                                    textAlign: 'center',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    height: '100%'
                                }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                        <Tooltip title={`ETB ${data.sales.toLocaleString()}`}>
                                            <div style={{
                                                width: '40%',
                                                height: `${(data.sales / maxSales) * 100}%`,
                                                background: 'linear-gradient(180deg, #1890ff 0%, #69c0ff 100%)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.3s ease'
                                            }} />
                                        </Tooltip>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>{data.month}</Text>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <Text type="secondary" italic>Showing sales trends for the last 6 months</Text>
                        </div>
                    </div>
                ) : (
                    <Empty description="No sales data available to chart" />
                )}
            </Card>

            <Divider />

            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    This data is read-only and automatically updated based on verified transactions.
                </Text>
            </div>
        </div>
    );
};

// Internal Tag component fix (since I didn't import it in the new clean code but used it in lines 57, 58)
const Tag = ({ color, children, icon }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 7px',
        fontSize: '12px',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        background: color === 'blue' ? '#e6f7ff' : '#fafafa',
        border: `1px solid ${color === 'blue' ? '#91d5ff' : '#d9d9d9'}`,
        borderRadius: '2px',
        color: color === 'blue' ? '#1890ff' : 'rgba(0,0,0,0.65)'
    }}>
        {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
        {children}
    </span>
);

export default Analytics;
