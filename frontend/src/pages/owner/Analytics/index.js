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
import { pharmacyOwnerAPI } from '../../../services/api/pharmacyOwner';

const { Title, Text, Paragraph } = Typography;

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        staffCount: 0
    });
    const [salesData, setSalesData] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.getAnalytics();
            if (response.data.success) {
                const { summary, trends } = response.data.data;
                setStats(summary);
                
                // Format trends for the chart
                if (trends && trends.salesOverTime) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const formattedTrends = trends.salesOverTime.map(item => ({
                        month: months[item._id.month - 1],
                        sales: item.total
                    }));
                    setSalesData(formattedTrends);
                }
            }
        } catch (error) {
            console.error('Fetch Analytics Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxSales = salesData.length > 0 ? Math.max(...salesData.map(d => d.sales)) : 0;

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
                </Space>
                <Paragraph type="secondary">
                    Review your pharmacy's business performance and growth trends.
                </Paragraph>
            </div>

            {/* 1. Summary Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable className="stat-card-premium">
                        <Statistic
                            title={<Space>Total Sales (Monthly) <Tooltip title="Gross revenue for the current calendar month"><InfoCircleOutlined /></Tooltip></Space>}
                            value={stats.totalRevenue || 0}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="ETB"
                            valueStyle={{ color: '#4361ee', fontWeight: '700' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable className="stat-card-premium">
                        <Statistic
                            title="Total Orders"
                            value={stats.totalOrders || 0}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#06d6a0', fontWeight: '700' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} hoverable className="stat-card-premium">
                        <Statistic
                            title="Staff Count"
                            value={stats.staffCount || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#722ed1', fontWeight: '700' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 2. Chart Section */}
            <Card
                title={<Space><LineChartOutlined /> Sales Over Time</Space>}
                bordered={false}
                className="chart-card-premium"
                style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
                {salesData.length > 0 ? (
                    <div style={{ padding: '24px 0' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            height: '300px',
                            padding: '0 20px 40px',
                            position: 'relative',
                            background: 'rgba(67, 97, 238, 0.02)',
                            borderRadius: '12px'
                        }}>
                            {/* Gridlines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                                <div key={p} style={{
                                    position: 'absolute',
                                    bottom: `${p * 100}%`,
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    background: 'rgba(0,0,0,0.05)',
                                    zIndex: 0
                                }} />
                            ))}

                            {salesData.map((data, index) => (
                                <div key={index} style={{
                                    textAlign: 'center',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    height: '100%',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                        <Tooltip title={`ETB ${data.sales.toLocaleString()}`}>
                                            <div style={{
                                                width: '50%',
                                                maxWidth: '60px',
                                                height: `${maxSales > 0 ? (data.sales / maxSales) * 100 : 5}%`,
                                                background: 'linear-gradient(180deg, #4361ee 0%, #4cc9f0 100%)',
                                                borderRadius: '8px 8px 0 0',
                                                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
                                                cursor: 'pointer'
                                            }} 
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scaleY(1.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scaleY(1)'}
                                            />
                                        </Tooltip>
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-30px',
                                        width: '100%'
                                    }}>
                                        <Text strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{data.month}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '48px', textAlign: 'center' }}>
                            <Text type="secondary" italic style={{ fontSize: '13px' }}>
                                <InfoCircleOutlined style={{ marginRight: '6px' }} />
                                Showing revenue trends for the last 6 months based on verified transactions.
                            </Text>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '60px 0' }}>
                        <Empty description="No sales data available to chart" />
                    </div>
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
