import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, message, Skeleton, Empty, Space } from 'antd';
import {
    DollarOutlined,
    ShoppingCartOutlined,
    MedicineBoxOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { pharmacyOwnerAPI } from '../../../services/api';
import './Dashboard.css';

const { Title, Text, Paragraph } = Typography;

const OwnerDashboard = () => {
    const isDev = process.env.NODE_ENV === 'development';

    // Mock data for development/presentation
    const mockData = {
        stats: {
            totalSales: 45890.50,
            totalOrders: 156,
            totalProducts: 420,
            totalStaff: 8
        },
        recentOrders: [
            {
                _id: '1',
                orderNumber: 'ORD-2023-001',
                customer: { firstName: 'Abebe', lastName: 'Bikila' },
                finalAmount: 1250,
                status: 'delivered',
                createdAt: new Date().toISOString()
            },
            {
                _id: '2',
                orderNumber: 'ORD-2023-002',
                customer: { firstName: 'Mulu', lastName: 'Tesfaye' },
                finalAmount: 840,
                status: 'pending',
                createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                _id: '3',
                orderNumber: 'ORD-2023-003',
                customer: { firstName: 'Kebede', lastName: 'Kassa' },
                finalAmount: 2100,
                status: 'processing',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                _id: '4',
                orderNumber: 'ORD-2023-004',
                customer: { firstName: 'Selam', lastName: 'Desta' },
                finalAmount: 450,
                status: 'completed',
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                _id: '5',
                orderNumber: 'ORD-2023-005',
                customer: { firstName: 'Tadesse', lastName: 'Girma' },
                finalAmount: 3200,
                status: 'cancelled',
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ]
    };

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.getDashboard();

            if (response.data.success && response.data.data) {
                // If API returns data, use it. 
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Fetch Dashboard Error:', error);
            if (error.response?.status !== 401) {
                const errorMsg = error.response?.data?.message || 'An error occurred while fetching statistics';
                message.error(errorMsg);
                console.error('Backend error details:', error.response?.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            render: (text) => <Text copyable>{text || 'N/A'}</Text>,
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            render: (customer) => (
                <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    {customer ? `${customer.firstName} ${customer.lastName}` : 'Guest'}
                </span>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'finalAmount',
            key: 'finalAmount',
            render: (amount) => <Text strong>ETB {amount ? amount.toLocaleString() : '0'}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'geekblue';
                const s = status ? status.toLowerCase() : 'unknown';
                if (s === 'completed' || s === 'delivered') color = 'green';
                if (s === 'cancelled') color = 'volcano';
                if (s === 'pending') color = 'gold';
                if (s === 'processing') color = 'blue';
                return (
                    <Tag color={color} key={s}>
                        {s.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status) => {
                let color = 'default';
                if (status === 'PAID') color = 'green';
                if (status === 'PENDING') color = 'orange';
                if (status === 'FAILED') color = 'red';
                return <Tag color={color}>{status || 'PENDING'}</Tag>;
            }
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
        }
    ];

    if (loading) {
        return (
            <div className="owner-dashboard">
                <Title level={2}>Dashboard Overview</Title>
                <Row gutter={[16, 16]}>
                    {[1, 2, 3, 4].map(i => (
                        <Col xs={24} sm={12} lg={6} key={i}>
                            <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
                        </Col>
                    ))}
                </Row>
                <Card style={{ marginTop: 24 }}>
                    <Skeleton active />
                </Card>
            </div>
        );
    }

    const stats = data?.stats || { totalSales: 0, totalOrders: 0, totalProducts: 0, totalStaff: 0 };

    return (
        <div className="owner-dashboard">
            <div className="dashboard-header">
                <Space align="center">
                    <Title level={2} style={{ marginBottom: 0 }}>Dashboard Overview</Title>
                </Space>
                <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    Welcome back! Here's a high-level overview of your pharmacy's current performance.
                </Paragraph>
            </div>

            <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card sales">
                        <Statistic
                            title="Total Sales"
                            value={stats.totalSales}
                            prefix={<DollarOutlined />}
                            suffix="ETB"
                            precision={2}
                        />
                        <div className="card-footer">Monthly revenue generated</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card orders">
                        <Statistic
                            title="Total Orders"
                            value={stats.totalOrders}
                            prefix={<ShoppingCartOutlined />}
                        />
                        <div className="card-footer">All transaction volume</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card products">
                        <Statistic
                            title="Inventory Status"
                            value={stats.totalProducts}
                            prefix={<MedicineBoxOutlined />}
                        />
                        <div className="card-footer">Active SKU count in stock</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card staff">
                        <Statistic
                            title="Team Size"
                            value={stats.totalStaff}
                            prefix={<TeamOutlined />}
                        />
                        <div className="card-footer">Active personnel count</div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />Recent Activity</span>}
                        extra={<Text type="secondary" size="small"><InfoCircleOutlined /> Last 5 transactions</Text>}
                        bordered={false}
                        className="recent-orders-card"
                    >
                        {data?.recentOrders?.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={data.recentOrders}
                                rowKey="_id"
                                pagination={false}
                                size="middle"
                            />
                        ) : (
                            <Empty description="No transaction activity recorded yet" />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OwnerDashboard;
