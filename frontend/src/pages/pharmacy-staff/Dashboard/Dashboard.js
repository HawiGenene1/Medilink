import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Row, Col, Statistic, message, Spin } from 'antd';
import {
    ShoppingOutlined,
    MedicineBoxOutlined,
    AlertOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, medicinesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './Dashboard.css';

dayjs.extend(relativeTime);

const PharmacyStaffDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState([
        { title: 'Total Orders', value: 0, icon: <ShoppingOutlined />, color: '#1890ff', prefix: '' },
        { title: 'Low Stock Items', value: 0, icon: <AlertOutlined />, color: '#ff4d4f', prefix: '' },
        { title: 'Today\'s Sales', value: 0, icon: <DollarOutlined />, color: '#52c41a', prefix: 'ETB ' },
        { title: 'Pending Orders', value: 0, icon: <MedicineBoxOutlined />, color: '#faad14', prefix: '' },
    ]);
    const [recentOrders, setRecentOrders] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        if (!user?.pharmacyId) return;
        try {
            setLoading(true);
            const [ordersRes, medsRes] = await Promise.all([
                ordersAPI.getPharmacyOrders(user.pharmacyId, { limit: 50 }),
                medicinesAPI.getAll({ pharmacyId: user.pharmacyId })
            ]);

            if (ordersRes.data?.success && medsRes.data?.success) {
                const ordersData = ordersRes.data.data || {};
                const orders = ordersData.orders || [];
                const medicinesData = medsRes.data.data || {};
                const medicines = medicinesData.medicines || [];

                const today = dayjs().startOf('day');
                const todayOrders = orders.filter(o => dayjs(o.createdAt).isAfter(today));
                const todaySales = todayOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
                const pendingCount = orders.filter(o => o.status === 'pending').length;
                const lowStockCount = medicines.filter(m => m.stockQuantity < (m.minStockLevel || 10)).length;

                setStats([
                    { title: 'Total Orders', value: ordersData.pagination?.total || 0, icon: <ShoppingOutlined />, color: '#1890ff', prefix: '' },
                    { title: 'Low Stock Items', value: lowStockCount, icon: <AlertOutlined />, color: '#ff4d4f', prefix: '' },
                    { title: 'Today\'s Sales', value: todaySales, icon: <DollarOutlined />, color: '#52c41a', prefix: 'ETB ' },
                    { title: 'Pending Orders', value: pendingCount, icon: <MedicineBoxOutlined />, color: '#faad14', prefix: '' },
                ]);

                setRecentOrders(orders.slice(0, 5).map(o => ({
                    key: o._id,
                    id: o.orderNumber || o._id?.substring(0, 8),
                    customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest',
                    items: o.items?.length || 0,
                    total: o.finalAmount || o.totalAmount,
                    status: o.status,
                    time: dayjs(o.createdAt).fromNow()
                })));
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            message.error('Failed to load dashboard overview');
        } finally {
            setLoading(false);
        }
    }, [user?.pharmacyId]);

    useEffect(() => {
        if (user?.pharmacyId) {
            fetchDashboardData();
        }
    }, [user, fetchDashboardData]);

    const columns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', render: (text) => <span className="order-id">{text}</span> },
        { title: 'Customer', dataIndex: 'customer', key: 'customer' },
        { title: 'Items', dataIndex: 'items', key: 'items' },
        { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => `ETB ${val?.toFixed(2) || '0.00'}` },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status) => {
                const s = status?.toLowerCase();
                let color = 'default';
                if (s === 'pending') color = 'gold';
                if (s === 'confirmed' || s === 'verified') color = 'blue';
                if (s === 'processing' || s === 'prepared') color = 'cyan';
                if (s === 'ready' || s === 'ready_for_pickup') color = 'purple';
                if (s === 'out_for_delivery') color = 'orange';
                if (s === 'delivered' || s === 'completed') color = 'green';
                if (s === 'cancelled') color = 'red';
                return <Tag color={color}>{status?.toUpperCase()}</Tag>;
            }
        },
        { title: 'Time', dataIndex: 'time', key: 'time', className: 'text-muted' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button type="link" size="small" onClick={() => navigate(`/pharmacy-staff/orders`)}>
                    View All
                </Button>
            ),
        },
    ];

    if (authLoading || loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading Dashboard..." /></div>;
    }

    if (!user) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Please login to view dashboard</div>;
    }

    return (
        <div className="pharmacy-dashboard">
            <div className="dashboard-header">
                <h2>Pharmacy Overview</h2>
                <p className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <Row gutter={[16, 16]} className="stats-row">
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card className="stat-card" bordered={false}>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.prefix}
                                valueStyle={{ color: stat.color }}
                                suffix={<span className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>{stat.icon}</span>}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} className="main-content-row">
                <Col span={24}>
                    <Card
                        title="Recent Orders"
                        bordered={false}
                        extra={<Button type="link" onClick={() => navigate('/pharmacy-staff/orders')}>View All</Button>}
                        className="content-card"
                    >
                        <Table
                            columns={columns}
                            dataSource={recentOrders}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PharmacyStaffDashboard;
