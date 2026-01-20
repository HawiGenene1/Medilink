import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Input, DatePicker, Select, Modal, Descriptions, Divider, List, Avatar, Row, Col, message } from 'antd';
import { EyeOutlined, SearchOutlined, FilterOutlined, ShoppingOutlined, UserOutlined, ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ordersAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import './Orders.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PharmacyStaffOrders = () => {
    const { user } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });

    useEffect(() => {
        if (user?.pharmacyId) {
            fetchOrders();
        }
    }, [user, statusFilter, pagination.current]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
            };

            if (statusFilter !== 'All') {
                params.status = statusFilter.toLowerCase();
            }

            const response = await ordersAPI.getPharmacyOrders(user.pharmacyId, params);
            if (response.data.success) {
                const formattedOrders = response.data.data.orders.map(order => ({
                    key: order._id,
                    id: order.orderNumber || order._id,
                    customer: `${order.customer?.firstName} ${order.customer?.lastName}`,
                    customerPhone: order.customer?.phone,
                    date: order.createdAt,
                    total: order.finalAmount || order.totalAmount,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    items: order.items.map(item => ({
                        id: item._id,
                        name: item.name || (item.medicine?.name),
                        quantity: item.quantity,
                        price: item.price
                    }))
                }));
                setOrders(formattedOrders);
                setPagination(prev => ({ ...prev, total: response.data.data.pagination.total }));
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            message.error('Failed to load orders from server');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'gold';
            case 'verified': return 'blue';
            case 'confirmed': return 'blue';
            case 'processing': return 'cyan';
            case 'prepared': return 'cyan';
            case 'ready': return 'purple';
            case 'out_for_delivery': return 'orange';
            case 'completed': return 'green';
            case 'delivered': return 'green';
            case 'cancelled': return 'red';
            default: return 'default';
        }
    };

    const handleView = (record) => {
        setSelectedOrder(record);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedOrder(null);
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            setLoading(true);
            const response = await ordersAPI.updateStatus(selectedOrder.key, newStatus);
            if (response.data.success) {
                message.success(`Order status updated to ${newStatus}`);
                handleCloseModal();
                fetchOrders();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            message.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            render: (text) => <Space><UserOutlined style={{ color: '#bfbfbf' }} /> {text}</Space>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => <Space><ClockCircleOutlined style={{ color: '#bfbfbf' }} /> {dayjs(date).format('MMM D, HH:mm')}</Space>
        },
        {
            title: 'Items',
            key: 'items',
            render: (_, record) => record.items.length
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (val) => <span style={{ fontWeight: 600 }}>${val.toFixed(2)}</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(record)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div className="orders-container">
            <Card className="orders-card" title="Incoming Orders" bordered={false}>
                {/* Filters */}
                <div className="orders-filters">
                    <Row gutter={16} align="middle">
                        <Col xs={24} md={8}>
                            <Input
                                placeholder="Search by Order ID or Customer"
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                            />
                        </Col>
                        <Col xs={24} md={6}>
                            <Select
                                defaultValue="All"
                                style={{ width: '100%' }}
                                onChange={setStatusFilter}
                                prefix={<FilterOutlined />}
                            >
                                <Option value="All">All Status</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="verified">Verified</Option>
                                <Option value="processing">Processing</Option>
                                <Option value="prepared">Prepared</Option>
                                <Option value="ready">Ready</Option>
                                <Option value="completed">Completed</Option>
                                <Option value="cancelled">Cancelled</Option>
                            </Select>
                        </Col>
                        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                            <Space>
                                <RangePicker />
                                <Button icon={<FilterOutlined />}>More Filters</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
                    }}
                    className="orders-table"
                />
            </Card>

            {/* Order Detail Modal */}
            <Modal
                title={
                    <Space>
                        <ShoppingOutlined />
                        <span>Order Details - {selectedOrder?.id}</span>
                        <Tag color={getStatusColor(selectedOrder?.status)}>{selectedOrder?.status?.toUpperCase()}</Tag>
                    </Space>
                }
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Close
                    </Button>,
                    selectedOrder?.status === 'pending' && (
                        <Button key="process" type="primary" onClick={() => handleUpdateStatus('verified')}>
                            Verify Order
                        </Button>
                    ),
                    selectedOrder?.status === 'verified' && (
                        <Button key="ready" type="primary" style={{ backgroundColor: '#13c2c2' }} onClick={() => handleUpdateStatus('prepared')}>
                            Mark Prepared (Deduct Stock)
                        </Button>
                    ),
                    ['prepared', 'processing'].includes(selectedOrder?.status) && (
                        <Button key="out" type="primary" onClick={() => handleUpdateStatus('out_for_delivery')}>
                            Out for Delivery
                        </Button>
                    )
                ]}
                width={700}
            >
                {selectedOrder && (
                    <div className="order-details-content">
                        <Descriptions title="Customer Info" bordered size="small" column={2}>
                            <Descriptions.Item label="Name">{selectedOrder.customer}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{selectedOrder.customerPhone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Order Date">{selectedOrder.date}</Descriptions.Item>
                            <Descriptions.Item label="Payment">{selectedOrder.paymentMethod}</Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Order Items</Divider>

                        <List
                            itemLayout="horizontal"
                            dataSource={selectedOrder.items}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />}
                                        title={item.name}
                                        description={`Quantity: ${item.quantity}`}
                                    />
                                    <div style={{ fontWeight: 600 }}>${item.price.toFixed(2)}</div>
                                </List.Item>
                            )}
                        />

                        <div className="order-total-section">
                            <Descriptions column={1} className="total-desc">
                                <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Total Amount</span>}>
                                    <span style={{ fontSize: '18px', color: '#52c41a', fontWeight: 'bold' }}>
                                        ${selectedOrder.total.toFixed(2)}
                                    </span>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PharmacyStaffOrders;
