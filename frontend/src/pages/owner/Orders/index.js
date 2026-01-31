import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Typography, Alert, Tabs } from 'antd';
import { EyeOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
// import { orderAPI } from '../../../services/api';

const { Title, Text } = Typography;

const OwnerOrders = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);

    // Permission Check
    const canProcessOrders = user?.operationalPermissions?.prepareOrders;

    useEffect(() => {
        // Mock data
        const mockData = [
            { _id: 'ORD-001', customer: 'Abebe Bikila', items: 3, total: 450.00, status: 'pending', date: '2026-01-30' },
            { _id: 'ORD-002', customer: 'Tirunesh Dibaba', items: 1, total: 120.00, status: 'processing', date: '2026-01-30' },
            { _id: 'ORD-003', customer: 'Haile Gebrselassie', items: 5, total: 1200.00, status: 'ready', date: '2026-01-29' },
        ];
        setOrders(mockData);
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            processing: 'blue',
            ready: 'green',
            completed: 'geekblue',
            cancelled: 'red'
        };
        return colors[status] || 'default';
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: '_id',
            key: '_id',
            render: text => <Text strong>{text}</Text>
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: total => `ETB ${total.toFixed(2)}`
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EyeOutlined />}>View Details</Button>

                    {/* Operational Action */}
                    {record.status === 'pending' && (
                        canProcessOrders ? (
                            <Button type="primary" size="small">Start Processing</Button>
                        ) : (
                            <Tag icon={<LockOutlined />} color="default">Read Only</Tag>
                        )
                    )}

                    {record.status === 'processing' && (
                        canProcessOrders ? (
                            <Button type="primary" success size="small" icon={<CheckCircleOutlined />}>Mark Ready</Button>
                        ) : (
                            <Tag icon={<LockOutlined />} color="default">Read Only</Tag>
                        )
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Order Oversight</Title>
                <Text type="secondary">Track order workflow and staff performance</Text>
            </div>

            {!canProcessOrders && (
                <Alert
                    message="Oversight Mode"
                    description="You can view order status and details (Oversight). To pack or process orders, enable 'Order Preparation' in Settings."
                    type="info"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />
            )}

            <Card bordered={false}>
                <Tabs defaultActiveKey="active" items={[
                    { key: 'active', label: 'Active Orders', children: <Table columns={columns} dataSource={orders} rowKey="_id" /> },
                    { key: 'history', label: 'Order History', children: <div style={{ padding: 20, textAlign: 'center' }}>No history yet</div> }
                ]} />
            </Card>
        </div>
    );
};

export default OwnerOrders;
