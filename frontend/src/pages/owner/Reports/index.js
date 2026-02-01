import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Tag, Space, Divider, Progress, Button, message } from 'antd';
import {
    BarChartOutlined,
    FallOutlined,
    RiseOutlined,
    DollarOutlined,
    ShoppingOutlined,
    TeamOutlined,
    CalendarOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    AlertOutlined,
    StopOutlined,
    DeleteOutlined,
    ReloadOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { getInventoryAlerts, checkInventoryAlerts } from '../../../services/api/inventoryAlerts';
import { pharmacyOwnerAPI } from '../../../services/api';

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

const MOCK_RECENT_ORDERS = [
    { key: '1', orderNumber: 'ORD-2026-001', customer: 'Abebe Bikila', amount: 1250, status: 'delivered', date: '2026-01-30', paymentMethod: 'CARD', paymentStatus: 'PAID' },
    { key: '2', orderNumber: 'ORD-2026-002', customer: 'Mulu Tesfaye', amount: 840, status: 'processing', date: '2026-01-30', paymentMethod: 'CASH_ON_DELIVERY', paymentStatus: 'PENDING' },
    { key: '3', orderNumber: 'ORD-2026-003', customer: 'Kebede Kassa', amount: 2100, status: 'pending', date: '2026-01-29', paymentMethod: 'CASH_ON_DELIVERY', paymentStatus: 'PENDING' },
    { key: '4', orderNumber: 'ORD-2026-004', customer: 'Selam Desta', amount: 450, status: 'completed', date: '2026-01-29', paymentMethod: 'CARD', paymentStatus: 'PAID' },
    { key: '5', orderNumber: 'ORD-2026-005', customer: 'Tadesse Girma', amount: 3200, status: 'cancelled', date: '2026-01-28', paymentMethod: 'CASH_ON_DELIVERY', paymentStatus: 'REFUNDED' },
];

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [alertLoading, setAlertLoading] = useState(false);
    const [alertData, setAlertData] = useState({
        summary: { lowStockCount: 0, outOfStockCount: 0, expiredCount: 0, nearExpiryCount: 0 },
        alerts: { lowStock: [], outOfStock: [], expired: [], nearExpiry: [] }
    });
    const [reportsData, setReportsData] = useState({
        summary: { totalRevenue: 0, totalOrders: 0, pendingOrders: 0, lowStockCount: 0, staffCount: 0 },
        salesTrends: [],
        staffTrends: []
    });

    // Detailed alert view state
    const [selectedAlertType, setSelectedAlertType] = useState(null);

    useEffect(() => {
        // Immediate load for mock data
        setLoading(false);
        fetchAlerts();
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.getReports();
            if (response.data.success) {
                setReportsData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            message.error('Could not load analytics summary');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            setAlertLoading(true);
            const response = await getInventoryAlerts();
            if (response.success) {
                setAlertData(response);
            }
        } catch (error) {
            console.error('Failed to fetch inventory alerts:', error);
            // Fallback to zeros if fetch fails
        } finally {
            setAlertLoading(false);
        }
    };

    const handleCheckAlerts = async () => {
        try {
            setAlertLoading(true);
            message.loading({ content: 'Scanning inventory...', key: 'scan' });
            await checkInventoryAlerts();
            await fetchAlerts();
            message.success({ content: 'Inventory scan complete. Alerts updated.', key: 'scan' });
        } catch (error) {
            console.error('Scan failed:', error);
            message.error({ content: 'Failed to scan inventory', key: 'scan' });
        } finally {
            setAlertLoading(false);
        }
    };

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
            render: (val) => `ETB ${val.toLocaleString()}`,
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

    const alertColumns = [
        {
            title: 'Medicine Name',
            dataIndex: ['medicine', 'name'],
            key: 'name',
            render: (text) => <Text strong>{text || 'Unknown'}</Text>
        },
        {
            title: 'Current Stock',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (val) => <Tag color={val === 0 ? 'red' : 'orange'}>{val}</Tag>
        },
        {
            title: 'Reorder Level',
            dataIndex: 'reorderLevel',
            key: 'reorderLevel',
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => {
                if (!date) return 'N/A';
                const d = new Date(date);
                const isExpired = d < new Date();
                return <Tag color={isExpired ? 'red' : 'orange'}>{d.toLocaleDateString()}</Tag>;
            }
        }
    ];

    const getAlertTableData = () => {
        if (!selectedAlertType) return [];
        return alertData.alerts[selectedAlertType] || [];
    };

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Space size="middle" align="center">
                    <Title level={2} style={{ marginBottom: 0 }}>
                        <BarChartOutlined /> Reports & Analytics
                    </Title>
                </Space>
                <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Track monthly performance, revenue growth, and workforce trends.</Text>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Total Revenue"
                            value={reportsData.summary.totalRevenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<DollarOutlined />}
                            suffix="ETB"
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Gross earnings from completed orders</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Total Orders"
                            value={reportsData.summary.totalOrders}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">{reportsData.summary.pendingOrders} orders currently pending</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Active Workforce"
                            value={reportsData.summary.staffCount}
                            prefix={<TeamOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Linked pharmacy personnel</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">
                <Space>
                    Inventory Alerts
                    <Button
                        type="text"
                        icon={<ReloadOutlined spin={alertLoading} />}
                        onClick={handleCheckAlerts}
                        size="small"
                    >
                        Scan & Refresh
                    </Button>
                </Space>
            </Divider>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card
                        bordered={false}
                        className={`report-card ${selectedAlertType === 'lowStock' ? 'alert-card-selected' : ''}`}
                        onClick={() => setSelectedAlertType(selectedAlertType === 'lowStock' ? null : 'lowStock')}
                        style={{ cursor: 'pointer', borderColor: selectedAlertType === 'lowStock' ? '#1890ff' : 'transparent', borderWidth: selectedAlertType === 'lowStock' ? 2 : 0 }}
                    >
                        <Statistic
                            title="Low Stock Items"
                            value={alertData.summary.lowStockCount}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<AlertOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Reorder recommended</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card
                        bordered={false}
                        className={`report-card ${selectedAlertType === 'outOfStock' ? 'alert-card-selected' : ''}`}
                        onClick={() => setSelectedAlertType(selectedAlertType === 'outOfStock' ? null : 'outOfStock')}
                        style={{ cursor: 'pointer', borderColor: selectedAlertType === 'outOfStock' ? '#1890ff' : 'transparent', borderWidth: selectedAlertType === 'outOfStock' ? 2 : 0 }}
                    >
                        <Statistic
                            title="Out of Stock"
                            value={alertData.summary.outOfStockCount}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<StopOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Immediate action required</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card
                        bordered={false}
                        className={`report-card ${selectedAlertType === 'nearExpiry' ? 'alert-card-selected' : ''}`}
                        onClick={() => setSelectedAlertType(selectedAlertType === 'nearExpiry' ? null : 'nearExpiry')}
                        style={{ cursor: 'pointer', borderColor: selectedAlertType === 'nearExpiry' ? '#1890ff' : 'transparent', borderWidth: selectedAlertType === 'nearExpiry' ? 2 : 0 }}
                    >
                        <Statistic
                            title="Near Expiry"
                            value={alertData.summary.nearExpiryCount}
                            valueStyle={{ color: '#fa8c16' }}
                            prefix={<ClockCircleOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Expires in &lt; 30 days</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card
                        bordered={false}
                        className={`report-card ${selectedAlertType === 'expired' ? 'alert-card-selected' : ''}`}
                        onClick={() => setSelectedAlertType(selectedAlertType === 'expired' ? null : 'expired')}
                        style={{ cursor: 'pointer', borderColor: selectedAlertType === 'expired' ? '#1890ff' : 'transparent', borderWidth: selectedAlertType === 'expired' ? 2 : 0 }}
                    >
                        <Statistic
                            title="Expired Products"
                            value={alertData.summary.expiredCount}
                            valueStyle={{ color: '#520339' }}
                            prefix={<DeleteOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Remove from shelves</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {selectedAlertType && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col span={24}>
                        <Card title={`${selectedAlertType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Details`} size="small">
                            <Table
                                dataSource={getAlertTableData()}
                                columns={alertColumns}
                                rowKey="_id"
                                pagination={{ pageSize: 5 }}
                                size="small"
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Divider orientation="left">Recent Orders (Oversight)</Divider>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                    <Card title={<Space><ShoppingOutlined /> Order Activity</Space>}>
                        <Table
                            dataSource={MOCK_RECENT_ORDERS}
                            pagination={false}
                            size="middle"
                            columns={[
                                {
                                    title: 'Order ID',
                                    dataIndex: 'orderNumber',
                                    key: 'orderNumber',
                                    render: (text) => <Text copyable>{text}</Text>
                                },
                                {
                                    title: 'Customer',
                                    dataIndex: 'customer',
                                    key: 'customer',
                                },
                                {
                                    title: 'Amount',
                                    dataIndex: 'amount',
                                    key: 'amount',
                                    render: (val) => <Text strong>ETB {val.toLocaleString()}</Text>
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    render: (status) => {
                                        const colors = {
                                            delivered: 'green',
                                            completed: 'green',
                                            processing: 'blue',
                                            pending: 'gold',
                                            cancelled: 'volcano'
                                        };
                                        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
                                    }
                                },
                                {
                                    title: 'Payment',
                                    key: 'payment',
                                    render: (_, record) => (
                                        <Space direction="vertical" size={0}>
                                            <Tag color={record.paymentStatus === 'PAID' ? 'success' : 'warning'} size="small">
                                                {record.paymentStatus}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {record.paymentMethod?.replace(/_/g, ' ')}
                                            </Text>
                                        </Space>
                                    )
                                },
                                {
                                    title: 'Date',
                                    dataIndex: 'date',
                                    key: 'date',
                                }
                            ]}
                        />
                        <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
                            <Text type="secondary">
                                <AlertOutlined /> This is a read-only view. Order processing is managed by staff or via Settings → Operational Access.
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">Operational Performance</Divider>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card title={<Space><BarChartOutlined /> Monthly Sales Summary</Space>} loading={loading}>
                        <Table
                            dataSource={reportsData.salesTrends.map((t, idx) => ({
                                key: idx,
                                period: `${new Date(0, t._id.month - 1).toLocaleString('default', { month: 'long' })} ${t._id.year}`,
                                revenue: t.revenue,
                                orders: t.orders,
                                growth: 0
                            }))}
                            columns={salesColumns}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>
                <Col span={24}>
                    <Card title={<Space><TeamOutlined /> Staff Count Trend</Space>} loading={loading}>
                        <Table
                            dataSource={reportsData.staffTrends.map((t, idx) => ({
                                key: idx,
                                period: `${new Date(0, t._id.month - 1).toLocaleString('default', { month: 'long' })} ${t._id.year}`,
                                totalStaff: '-',
                                newJoiners: t.totalNew,
                                turnover: 0
                            }))}
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
        </div >
    );
};

export default Reports;
