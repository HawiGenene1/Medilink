import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, message, List, Badge, Space, Skeleton, Button } from 'antd';
import {
    ShoppingCartOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ContainerOutlined,
    ArrowRightOutlined,
    MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderProcessingAPI, inventoryAPI } from '../../../services/api';
import './StaffDashboard.css';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const StaffDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [tasks, setTasks] = useState([]); // Still using mock for tasks as no backend exists yet

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch data from real APIs
            const [ordersRes, inventoryRes] = await Promise.allSettled([
                orderProcessingAPI.getOrders({ limit: 5 }),
                inventoryAPI.get()
            ]);

            if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
                setOrders(ordersRes.value.data.data);
            } else if (ordersRes.status === 'rejected') {
                message.warning('Could not sync latest orders. Please check your connection.');
            }

            if (inventoryRes.status === 'fulfilled' && inventoryRes.value.data.success) {
                // Filter for low stock items (quantity <= reorderLevel)
                const inventory = inventoryRes.value.data.data;
                const lowStock = inventory.filter(item => item.quantity <= item.reorderLevel);
                setAlerts(lowStock);
            } else if (inventoryRes.status === 'rejected') {
                message.warning('Could not load inventory alerts.');
            }

            // Mock tasks for now
            setTasks([
                { id: 1, title: 'Verify Prescription for Order #ORD-2024-001', priority: 'high', status: 'pending' },
                { id: 2, title: 'Restock Paracetamol 500mg', priority: 'medium', status: 'pending' },
                { id: 3, title: 'Daily fridge temperature check', priority: 'low', status: 'completed' }
            ]);

        } catch (error) {
            console.error('Staff Dashboard Fetch Error:', error);
            // Handle error without redirecting (user requested non-auth errors shouldn't redirect)
            message.error('A system error occurred while updating the dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const orderColumns = [
        {
            title: 'Order Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'gold';
                if (['preparing', 'processing'].includes(status)) color = 'blue';
                if (['ready_for_pickup', 'verified'].includes(status)) color = 'green';
                if (['delivered', 'completed'].includes(status)) color = 'cyan';
                return <Tag color={color}>{status.toUpperCase().replace('_', ' ')}</Tag>;
            }
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ];

    if (loading) return <div style={{ padding: 24 }}><Skeleton active /><Skeleton active /></div>;

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const preparingCount = orders.filter(o => ['preparing', 'processing'].includes(o.status)).length;

    return (
        <div className="staff-dashboard">
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ marginBottom: 0 }}>Operational Center</Title>
                    <Text type="secondary">System Status: Active | Connected to {user?.pharmacyName || 'Local Pharmacy'}</Text>
                </Col>
                <Col>
                    <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('/owner/orders')}>
                        Process Orders
                    </Button>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="staff-stat-card pending">
                        <Statistic
                            title="New Orders"
                            value={pendingCount}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="staff-stat-card preparing">
                        <Statistic
                            title="Processing"
                            value={preparingCount}
                            prefix={<ContainerOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="staff-stat-card low-stock">
                        <Statistic
                            title="Inventory Alerts"
                            value={alerts.length}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="staff-stat-card quick-links">
                        <Title level={5} style={{ marginTop: 0 }}>Quick Access</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button block icon={<MedicineBoxOutlined />} onClick={() => navigate('/owner/inventory')}>Inventory</Button>
                            <Button block icon={<ShoppingCartOutlined />} onClick={() => navigate('/owner/orders')}>Orders</Button>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={15}>
                    <Card title={<span><ShoppingCartOutlined /> Latest Orders</span>} extra={<Button type="link" onClick={() => navigate('/owner/orders')}>View All</Button>}>
                        <Table
                            dataSource={orders}
                            columns={orderColumns}
                            rowKey="_id"
                            pagination={false}
                            size="middle"
                            locale={{ emptyText: 'No active orders requiring processing' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={9}>
                    <Card title={<span><CheckCircleOutlined /> Priority Tasks</span>}>
                        <List
                            dataSource={tasks}
                            renderItem={item => (
                                <List.Item>
                                    <Space size="middle">
                                        <Badge status={item.status === 'completed' ? 'success' : 'processing'} />
                                        <div style={{ textDecoration: item.status === 'completed' ? 'line-through' : 'none' }}>
                                            <Text strong={item.priority === 'high'}>{item.title}</Text>
                                        </div>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {alerts.length > 0 && (
                <Row style={{ marginTop: 24 }}>
                    <Col span={24}>
                        <Card
                            title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> Critical Low Stock</span>}
                            extra={<Button danger type="link" onClick={() => navigate('/owner/inventory')}>Manage Stock</Button>}
                        >
                            <Table
                                dataSource={alerts}
                                columns={[
                                    { title: 'Medicine', dataIndex: ['medicine', 'name'], key: 'name' },
                                    { title: 'On Hand', dataIndex: 'quantity', key: 'quantity', render: (q) => <Text type="danger">{q}</Text> },
                                    { title: 'Action', key: 'action', render: () => <Tag color="error">REORDER</Tag> }
                                ]}
                                rowKey="_id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default StaffDashboard;
