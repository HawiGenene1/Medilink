import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Tag, Space, Typography, message, Modal, Descriptions, Row, Col, Input, Select, Image, Avatar, Divider } from 'antd';
import { EyeOutlined, CheckCircleOutlined, SyncOutlined, SearchOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { orderProcessingAPI } from '../../../services/api';
import './OrderManagement.css';

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

    const role = user?.role?.toLowerCase();
    const isOwner = role === 'pharmacy_owner' || role === 'owner';
    const isStaff = ['staff', 'pharmacist', 'technician', 'cashier', 'assistant', 'pharmacy_staff'].includes(role) || isOwner;
    const canProcess = isStaff || (isOwner && user?.operationalPermissions?.prepareOrders !== false);

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

    const handleVerifyPrescription = async (id, isApproved) => {
        try {
            const res = await orderProcessingAPI.verifyPrescription(id, { isApproved, notes: isApproved ? 'Verified by staff' : 'Rejected by staff' });
            if (res.data.success) {
                message.success(`Prescription ${isApproved ? 'verified' : 'rejected'}`);
                fetchOrders();
                setDetailVisible(false);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Verification update failed');
        }
    };

    const handleRequestPhysicalRx = async (id) => {
        try {
            const res = await orderProcessingAPI.requestPhysicalPrescription(id, { note: 'Physical prescription required in person.' });
            if (res.data.success) {
                message.info('Requested physical prescription');
                fetchOrders();
                setDetailVisible(false);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Request failed');
        }
    };

    const getStatusTag = (status) => {
        const map = {
            awaiting_prescription: { color: 'warning', text: 'NEEDS VERIFICATION' },
            awaiting_physical_prescription: { color: 'orange', text: 'AWAITING PHYSICAL RX' },
            pending: { color: 'gold', text: 'PENDING' },
            processing: { color: 'blue', text: 'PREPARING' },
            prepared: { color: 'cyan', text: 'PACKED' },
            ready_for_pickup: { color: 'green', text: 'READY' },
            out_for_delivery: { color: 'purple', text: 'IN TRANSIT' },
            delivered: { color: 'success', text: 'DELIVERED' },
            cancelled: { color: 'error', text: 'CANCELLED' }
        };
        const config = map[status] || { color: 'default', text: (status || 'UNKNOWN').toUpperCase() };
        return <Tag color={config.color} className="status-badge-custom">{config.text}</Tag>;
    };

    const getPaymentTag = (status) => {
        const map = {
            PENDING: { color: 'warning', text: 'PENDING' },
            PAID: { color: 'success', text: 'PAID' },
            FAILED: { color: 'error', text: 'FAILED' },
            REFUNDED: { color: 'default', text: 'REFUNDED' }
        };
        const config = map[status] || { color: 'default', text: status || 'UNKNOWN' };
        return <Tag color={config.color} style={{ borderRadius: '4px', fontSize: '10px' }}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderNumber',
            key: 'number',
            render: (num) => <Text strong style={{ color: '#1e293b' }}>#{num?.split('-').pop() || num}</Text>
        },
        {
            title: 'Customer',
            dataIndex: ['customer', 'firstName'],
            key: 'customer',
            render: (_, record) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} src={`https://ui-avatars.com/api/?name=${record.customer?.firstName}&background=random`} />
                    <Text>{record.customer?.firstName} {record.customer?.lastName}</Text>
                </Space>
            )
        },
        {
            title: 'Total Amount',
            dataIndex: 'finalAmount',
            key: 'amount',
            render: (amount) => <Text strong>{amount} ETB</Text>
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
                <div className="payment-status-wrapper">
                    {getPaymentTag(status)}
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {record.paymentMethod?.replace(/_/g, ' ')}
                    </Text>
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setDetailVisible(true); }} className="btn-modern-secondary">Details</Button>
                    {canProcess && (record.status === 'awaiting_prescription' || record.status === 'awaiting_physical_prescription' || (record.status === 'pending' && record.prescriptionRequired)) && (
                        <Button type="primary" size="small" className="btn-process-gradient" onClick={() => { setSelectedOrder(record); setDetailVisible(true); }}>Review Rx</Button>
                    )}
                    {canProcess && record.status === 'pending' && !record.prescriptionRequired && (
                        <Button type="primary" size="small" className="btn-process-gradient" onClick={() => handleUpdateStatus(record._id, 'processing')}>Start Preparing</Button>
                    )}
                    {canProcess && record.status === 'processing' && (
                        <Button type="primary" size="small" className="btn-process-gradient" onClick={() => handleUpdateStatus(record._id, 'ready_for_pickup')}>Mark Ready</Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="order-management-container fade-in-premium">
            <div className="order-header-card">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Order Dashboard</Title>
                        <Text type="secondary" style={{ fontSize: '15px' }}>Efficiently manage pharmacy orders and verifications.</Text>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <Input
                                placeholder="Search Order # or Name"
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                style={{ width: 280 }}
                                className="premium-search-bar"
                                onChange={e => setSearchTerm(e.target.value)}
                                allowClear
                            />
                            <Select
                                defaultValue="all"
                                style={{ width: 180 }}
                                className="premium-select"
                                onChange={value => setStatusFilter(value)}
                            >
                                <Option value="all">All Orders</Option>
                                <Option value="awaiting_prescription">Needs Review</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="processing">Preparing</Option>
                                <Option value="ready_for_pickup">Ready</Option>
                                <Option value="delivered">Completed</Option>
                            </Select>
                            <Button 
                                icon={<SyncOutlined spin={loading} />} 
                                onClick={fetchOrders}
                                shape="circle"
                            />
                        </Space>
                    </Col>
                </Row>
            </div>

            <Card bordered={false} className="order-table-card">
                <Table
                    dataSource={filteredOrders}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    className="order-mgmt-table"
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    onRow={(record) => ({
                        onDoubleClick: () => { setSelectedOrder(record); setDetailVisible(true); }
                    })}
                />
            </Card>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCartOutlined style={{ color: '#1e88e5' }} />
                        <span>Order Details: #{selectedOrder?.orderNumber?.split('-').pop()}</span>
                    </div>
                }
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                className="order-detail-modal"
                footer={null}
                width={750}
            >
                {selectedOrder && (
                    <div style={{ padding: '4px' }}>
                        <Row gutter={[24, 24]}>
                            <Col span={14}>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                                    <Title level={5}>Customer Information</Title>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                        <Avatar size={48} src={`https://ui-avatars.com/api/?name=${selectedOrder.customer?.firstName}&background=1e88e5&color=fff`} />
                                        <div>
                                            <Text strong block style={{ fontSize: '16px' }}>{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</Text>
                                            <Text type="secondary">{selectedOrder.customer?.phone || 'No phone provided'}</Text>
                                        </div>
                                    </div>
                                </div>

                                <Title level={5}>Order Items</Title>
                                <Table
                                    dataSource={selectedOrder.items}
                                    pagination={false}
                                    size="small"
                                    className="order-detail-table"
                                    columns={[
                                        { title: 'Medicine', dataIndex: 'name', key: 'name', render: text => <Text strong>{text}</Text> },
                                        { title: 'Qty', dataIndex: 'quantity', key: 'qty', align: 'center' },
                                        { title: 'Price', dataIndex: 'price', key: 'price', align: 'right', render: p => <Text style={{ color: '#1e88e5' }}>{p} ETB</Text> }
                                    ]}
                                />
                            </Col>

                            <Col span={10}>
                                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fde68a' }}>
                                    <Title level={5}>Payment Summary</Title>
                                    <Row justify="space-between" style={{ marginBottom: '8px' }}>
                                        <Text type="secondary">Method</Text>
                                        <Text strong>{selectedOrder.paymentMethod?.replace(/_/g, ' ')}</Text>
                                    </Row>
                                    <Row justify="space-between" style={{ marginBottom: '8px' }}>
                                        <Text type="secondary">Status</Text>
                                        {getPaymentTag(selectedOrder.paymentStatus)}
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Row justify="space-between">
                                        <Title level={4} style={{ margin: 0 }}>Total</Title>
                                        <Title level={4} style={{ margin: 0, color: '#b91c1c' }}>{selectedOrder.finalAmount} ETB</Title>
                                    </Row>
                                </div>

                                {selectedOrder.prescriptionRequired && selectedOrder.prescriptionImage && (
                                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                        <Title level={5}>Prescription</Title>
                                        <div style={{ textAlign: 'center', margin: '12px 0' }}>
                                            <Image
                                                width="100%"
                                                src={`http://localhost:5000${selectedOrder.prescriptionImage}`}
                                                style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </Row>

                        <div style={{ marginTop: 32, textAlign: 'right', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <Space size="middle">
                                <Button onClick={() => setDetailVisible(false)} size="large" style={{ borderRadius: '8px' }}>Close</Button>
                                {canProcess && (selectedOrder.status === 'awaiting_prescription' || selectedOrder.status === 'awaiting_physical_prescription' || (selectedOrder.status === 'pending' && selectedOrder.prescriptionRequired)) && (
                                    <Space>
                                        <Button onClick={() => handleRequestPhysicalRx(selectedOrder._id)} size="large">Request Physical</Button>
                                        <Button danger onClick={() => handleVerifyPrescription(selectedOrder._id, false)} size="large">Reject</Button>
                                        <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleVerifyPrescription(selectedOrder._id, true)} size="large" className="btn-process-gradient">Approve</Button>
                                    </Space>
                                )}
                                {canProcess && selectedOrder.status === 'pending' && (
                                    <Button type="primary" size="large" className="btn-process-gradient" onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}>Start Preparing</Button>
                                )}
                                {canProcess && selectedOrder.status === 'processing' && (
                                    <Button type="primary" icon={<CheckCircleOutlined />} size="large" className="btn-process-gradient" onClick={() => handleUpdateStatus(selectedOrder._id, 'ready_for_pickup')}>Mark Ready</Button>
                                )}
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;
