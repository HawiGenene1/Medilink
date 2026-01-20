import React from 'react';
import { Card, Table, Tag, Button, Row, Col, Statistic, List, Avatar } from 'antd';
import {
    ShoppingOutlined,
    MedicineBoxOutlined,
    AlertOutlined,
    ArrowRightOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const PharmacyStaffDashboard = () => {
    const navigate = useNavigate();

    // Mock data
    const stats = [
        { title: 'Total Orders', value: 12, icon: <ShoppingOutlined />, color: '#1890ff', prefix: '' },
        { title: 'Low Stock Items', value: 5, icon: <AlertOutlined />, color: '#ff4d4f', prefix: '' },
        { title: 'Today\'s Sales', value: 450, icon: <DollarOutlined />, color: '#52c41a', prefix: '$' },
        { title: 'Pending Orders', value: 8, icon: <MedicineBoxOutlined />, color: '#faad14', prefix: '' },
    ];

    // lowStockItems removed as Inventory Alerts section is deprecated from Dashboard

    const recentOrders = [
        { key: '1', id: '#ORD-001', customer: 'Abebe Kebede', items: 3, total: 125.00, status: 'Pending', time: '10 mins ago' },
        { key: '2', id: '#ORD-002', customer: 'Sara Tesfaye', items: 1, total: 45.50, status: 'Processing', time: '25 mins ago' },
        { key: '3', id: '#ORD-003', customer: 'Dawit Alemu', items: 5, total: 320.00, status: 'Ready', time: '1 hour ago' },
        { key: '4', id: '#ORD-004', customer: 'Marta Hailu', items: 2, total: 85.00, status: 'Completed', time: '2 hours ago' },
    ];

    const columns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', render: (text) => <span className="order-id">{text}</span> },
        { title: 'Customer', dataIndex: 'customer', key: 'customer' },
        { title: 'Items', dataIndex: 'items', key: 'items' },
        { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => `$${val.toFixed(2)}` },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'Pending') color = 'gold';
                if (status === 'Processing') color = 'blue';
                if (status === 'Ready') color = 'green';
                if (status === 'Completed') color = 'default';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        { title: 'Time', dataIndex: 'time', key: 'time', className: 'text-muted' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button type="link" size="small" onClick={() => navigate(`/pharmacy-staff/orders/${record.id}`)}>
                    View
                </Button>
            ),
        },
    ];

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
