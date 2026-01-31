import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Space, message, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    ReloadOutlined,
    EyeOutlined,
    FileTextOutlined,
    CreditCardOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import './TransactionHistory.css';

const { Title, Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TransactionHistory = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    useEffect(() => {
        fetchPayments();
    }, [pagination.current]);

    const fetchPayments = async (page = pagination.current) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_URL}/payments/customer?page=${page}&limit=${pagination.pageSize}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                setPayments(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    current: data.page || 1
                }));
            } else {
                message.error('Failed to load payment history');
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            message.error('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
            pending: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' },
            failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
            cancelled: { color: 'default', icon: <CloseCircleOutlined />, text: 'Cancelled' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        );
    };

    const getPaymentMethodDisplay = (method, metadata) => {
        if (metadata && metadata.selectedProvider) {
            return metadata.selectedProvider.toUpperCase();
        }
        return method === 'mobile_money' ? 'Mobile Money' :
            method === 'card' ? 'Card' :
                method?.toUpperCase();
    };

    const columns = [
        {
            title: 'Transaction ID',
            dataIndex: 'transactionId',
            key: 'transactionId',
            render: (text) => (
                <Text code copyable={{ text }}>
                    {text.substring(0, 16)}...
                </Text>
            )
        },
        {
            title: 'Order Number',
            dataIndex: ['order', 'orderNumber'],
            key: 'orderNumber',
            render: (text, record) => (
                <Button
                    type="link"
                    onClick={() => navigate(`/customer/orders`)}
                >
                    {text}
                </Button>
            )
        },
        {
            title: 'Pharmacy',
            dataIndex: ['pharmacy', 'name'],
            key: 'pharmacy',
            ellipsis: true
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => <Text strong>ETB {amount?.toFixed(2)}</Text>,
            sorter: (a, b) => a.amount - b.amount
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method, record) => getPaymentMethodDisplay(method, record.metadata)
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'status',
            render: (status) => getPaymentStatusTag(status),
            filters: [
                { text: 'Completed', value: 'completed' },
                { text: 'Pending', value: 'pending' },
                { text: 'Failed', value: 'failed' }
            ],
            onFilter: (value, record) => record.paymentStatus === value
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: (date) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            defaultSortOrder: 'descend'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.paymentStatus === 'completed' && (
                        <Button
                            icon={<FileTextOutlined />}
                            size="small"
                            onClick={() => navigate(`/customer/orders/${record.order._id}/invoice`)}
                        >
                            Receipt
                        </Button>
                    )}
                    <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => navigate(`/customer/orders`)}
                    >
                        View Order
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="transaction-history-container">
            <Card>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2}>
                            <CreditCardOutlined /> Transaction History
                        </Title>
                        <Text type="secondary">
                            View all your payment transactions and receipts
                        </Text>
                    </div>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchPayments()}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>

                {loading && payments.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <Spin size="large" tip="Loading transaction history...">
                            <div style={{ padding: 20 }} />
                        </Spin>
                    </div>
                ) : payments.length === 0 ? (
                    <Empty
                        description="No payment transactions yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/customer/orders')}>
                            View Orders
                        </Button>
                    </Empty>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={payments}
                        rowKey={(record) => record._id || record.transactionId}
                        loading={loading}
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} transactions`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                )}
            </Card>
        </div>
    );
};

export default TransactionHistory;
