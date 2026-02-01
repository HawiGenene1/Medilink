import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Tag, Space, Typography, message, Modal, Descriptions, Row, Col, Input, Select } from 'antd';
import { EyeOutlined, CheckCircleOutlined, SyncOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { orderProcessingAPI } from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const OrderManagement = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const canProcess = user?.role === 'PHARMACY_OWNER' || user?.operationalPermissions?.prepareOrders;

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await orderProcessingAPI.getOrders();
            if (res.data.success) {
                setOrders(res.data.data);
                setFilteredOrders(res.data.data);
            }
        } catch (error) {
            message.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        let result = orders;
        if (searchTerm) {
            result = result.filter(o =>
                o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (`${o.customer?.firstName} ${o.customer?.lastName}`).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(o => o.status === statusFilter);
        }
        setFilteredOrders(result);
    }, [searchTerm, statusFilter, orders]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await orderProcessingAPI.updateStatus(id, { status });
            if (res.data.success) {
                message.success(`Order set to ${status}`);
                fetchOrders();
                setDetailVisible(false);
            }
        } catch (error) {
            message.error('Status update failed');
        }
    };

    const getStatusTag = (status) => {
        const map = {
            pending: { color: 'gold', text: 'PENDING' },
            processing: { color: 'blue', text: 'PREPARING' },
            prepared: { color: 'cyan', text: 'PACKED' },
            ready_for_pickup: { color: 'green', text: 'READY' },
            out_for_delivery: { color: 'purple', text: 'IN TRANSIT' },
            delivered: { color: 'success', text: 'DELIVERED' },
            cancelled: { color: 'error', text: 'CANCELLED' }
        };
        const config = map[status] || { color: 'default', text: (status || 'UNKNOWN').toUpperCase() };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getPaymentTag = (status) => {
        const map = {
            PENDING: { color: 'warning', text: 'PENDING' },
            PAID: { color: 'success', text: 'PAID' },
            FAILED: { color: 'error', text: 'FAILED' },
            REFUNDED: { color: 'default', text: 'REFUNDED' }
        };
        const config = map[status] || { color: 'default', text: status || 'UNKNOWN' };
        return <Tag color={config.color} style={{ borderRadius: '4px' }}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: 'Order Number',
            dataIndex: 'orderNumber',
            key: 'number',
            render: (num) => <Text strong>{num}</Text>
        },
        {
            title: 'Customer',
            dataIndex: ['customer', 'firstName'],
            key: 'customer',
            render: (_, record) => `${record.customer?.firstName} ${record.customer?.lastName}`
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'itemsCount',
            render: (items) => items.length
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status)
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'payment',
            render: (status, record) => (
                <Space direction="vertical" size={0}>
                    {getPaymentTag(status)}
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {record.paymentMethod?.replace(/_/g, ' ')}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setDetailVisible(true); }}>Details</Button>
                    {canProcess && record.status === 'pending' && (
                        <Button type="primary" size="small" onClick={() => handleUpdateStatus(record._id, 'processing')}>Start Preparing</Button>
                    )}
                    {canProcess && record.status === 'processing' && (
                        <Button type="primary" success="true" size="small" onClick={() => handleUpdateStatus(record._id, 'ready_for_pickup')}>Mark Ready</Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ marginBottom: 0 }}>Order Processing</Title>
                    <Text type="secondary">Manage customer orders and prescription verifications.</Text>
                </Col>
                <Col>
                    <Space>
                        <Input
                            placeholder="Search Order # or Name"
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }}
                            onChange={e => setSearchTerm(e.target.value)}
                            allowClear
                        />
                        <Select
                            defaultValue="all"
                            style={{ width: 150 }}
                            onChange={value => setStatusFilter(value)}
                        >
                            <Option value="all">All Status</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="processing">Preparing</Option>
                            <Option value="ready_for_pickup">Ready</Option>
                            <Option value="delivered">Delivered</Option>
                        </Select>
                        <Button icon={<SyncOutlined spin={loading} />} onClick={fetchOrders} />
                    </Space>
                </Col>
            </Row>

            <Card bordered={false}>
                <Table
                    dataSource={filteredOrders}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    onRow={(record) => ({
                        onDoubleClick: () => { setSelectedOrder(record); setDetailVisible(true); }
                    })}
                />
            </Card>

            <Modal
                title={`Order Details: ${selectedOrder?.orderNumber}`}
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Customer">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Contact">{selectedOrder.customer?.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Total">ETB {selectedOrder.finalAmount}</Descriptions.Item>
                            <Descriptions.Item label="Status">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
                            <Descriptions.Item label="Payment Method">{selectedOrder.paymentMethod?.replace(/_/g, ' ')}</Descriptions.Item>
                            <Descriptions.Item label="Payment Status">{getPaymentTag(selectedOrder.paymentStatus)}</Descriptions.Item>
                        </Descriptions>
                        <Title level={5} style={{ marginTop: 20 }}>Order Items</Title>
                        <Table
                            dataSource={selectedOrder.items}
                            pagination={false}
                            size="small"
                            columns={[
                                { title: 'Medicine', dataIndex: 'name', key: 'name' },
                                { title: 'Qty', dataIndex: 'quantity', key: 'qty' },
                                { title: 'Price', dataIndex: 'price', key: 'price', render: p => `${p} ETB` }
                            ]}
                        />
                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            <Space>
                                {canProcess && selectedOrder.status === 'pending' && (
                                    <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}>Start Preparing</Button>
                                )}
                                {canProcess && selectedOrder.status === 'processing' && (
                                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(selectedOrder._id, 'ready_for_pickup')}>Complete & Notify</Button>
                                )}
                                <Button onClick={() => setDetailVisible(false)}>Close</Button>
                            </Space>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;
