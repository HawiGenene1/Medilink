import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, DatePicker, Select, Modal, Descriptions, Divider, List, Avatar, Row, Col } from 'antd';
import { EyeOutlined, SearchOutlined, FilterOutlined, ShoppingOutlined, UserOutlined, ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './Orders.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PharmacyStaffOrders = () => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Mock Data
    const orders = [
        {
            key: '1',
            id: 'ORD-2024-001',
            customer: 'Abebe Kebede',
            customerPhone: '+251 911 234 567',
            date: '2024-01-19 14:30',
            total: 125.00,
            status: 'Pending',
            paymentMethod: 'Cash on Delivery',
            items: [
                { id: 1, name: 'Amoxicillin 500mg', quantity: 1, price: 125.00 }
            ]
        },
        {
            key: '2',
            id: 'ORD-2024-002',
            customer: 'Sara Tesfaye',
            customerPhone: '+251 922 345 678',
            date: '2024-01-19 13:15',
            total: 45.50,
            status: 'Processing',
            paymentMethod: 'Telebirr',
            items: [
                { id: 1, name: 'Paracetamol 500mg', quantity: 2, price: 10.00 },
                { id: 2, name: 'Vitamin C', quantity: 1, price: 25.50 }
            ]
        },
        {
            key: '3',
            id: 'ORD-2024-003',
            customer: 'Dawit Alemu',
            customerPhone: '+251 933 456 789',
            date: '2024-01-19 12:00',
            total: 320.00,
            status: 'Ready',
            paymentMethod: 'CBE Birr',
            items: [
                { id: 1, name: 'Omeprazole 20mg', quantity: 3, price: 300.00 },
                { id: 2, name: 'Surgical Mask', quantity: 1, price: 20.00 }
            ]
        },
        {
            key: '4',
            id: 'ORD-2024-004',
            customer: 'Marta Hailu',
            customerPhone: '+251 944 567 890',
            date: '2024-01-18 16:45',
            total: 85.00,
            status: 'Completed',
            paymentMethod: 'Cash',
            items: [
                { id: 1, name: 'Ibuprofen 400mg', quantity: 1, price: 85.00 }
            ]
        },
        {
            key: '5',
            id: 'ORD-2024-005',
            customer: 'Yonas Tadesse',
            customerPhone: '+251 955 678 901',
            date: '2024-01-18 10:20',
            total: 15.00,
            status: 'Cancelled',
            paymentMethod: 'Cash',
            items: [
                { id: 1, name: 'Bandage', quantity: 3, price: 5.00 }
            ]
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'gold';
            case 'Processing': return 'blue';
            case 'Ready': return 'cyan';
            case 'Completed': return 'green';
            case 'Cancelled': return 'red';
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

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        const matchesSearch = order.customer.toLowerCase().includes(searchText.toLowerCase()) ||
            order.id.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
    });

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
                                <Option value="Pending">Pending</Option>
                                <Option value="Processing">Processing</Option>
                                <Option value="Ready">Ready</Option>
                                <Option value="Completed">Completed</Option>
                                <Option value="Cancelled">Cancelled</Option>
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
                    pagination={{ pageSize: 8 }}
                    className="orders-table"
                />
            </Card>

            {/* Order Detail Modal */}
            <Modal
                title={
                    <Space>
                        <ShoppingOutlined />
                        <span>Order Details - {selectedOrder?.id}</span>
                        <Tag color={getStatusColor(selectedOrder?.status)}>{selectedOrder?.status}</Tag>
                    </Space>
                }
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Close
                    </Button>,
                    selectedOrder?.status === 'Pending' && (
                        <Button key="process" type="primary" onClick={handleCloseModal}>
                            Process Order
                        </Button>
                    ),
                    selectedOrder?.status === 'Processing' && (
                        <Button key="ready" type="primary" style={{ backgroundColor: '#13c2c2' }} onClick={handleCloseModal}>
                            Mark Ready
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
