import React, { useState, useEffect } from 'react';
import {
    Table, Card, Tag, Space, Input, Select,
    Typography, message, Tooltip, Button
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    EyeOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import api from '../../../services/api';

const { Title } = Typography;
const { Option } = Select;

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchOrders = async (page = 1, status = statusFilter, searchTxt = search) => {
        setLoading(true);
        try {
            const response = await api.get('/admin/orders', {
                params: {
                    page,
                    limit: pagination.pageSize,
                    status,
                    search: searchTxt
                }
            });
            if (response.data.success) {
                setOrders(response.data.data);
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.data.pagination.total
                });
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
            message.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleTableChange = (newPagination) => {
        fetchOrders(newPagination.current);
    };

    const handleSearch = (value) => {
        setSearch(value);
        fetchOrders(1, statusFilter, value);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        fetchOrders(1, value, search);
    };

    const columns = [
        {
            title: 'Order #',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            render: (customer) => customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'
        },
        {
            title: 'Pharmacy',
            dataIndex: 'pharmacy',
            key: 'pharmacy',
            render: (pharmacy) => pharmacy?.name || 'N/A'
        },
        {
            title: 'Amount',
            dataIndex: 'finalAmount',
            key: 'finalAmount',
            render: (amount) => `ETB ${amount.toFixed(2)}`
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'delivered' || status === 'completed') color = 'green';
                if (status === 'cancelled') color = 'red';
                if (status === 'processing' || status === 'preparing') color = 'orange';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button icon={<EyeOutlined />} size="small" />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="orders-management">
            <Title level={2}>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                Global Order Monitoring
            </Title>

            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Search Order #"
                        prefix={<SearchOutlined />}
                        onPressEnter={(e) => handleSearch(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Select
                        placeholder="Filter by Status"
                        style={{ width: 200 }}
                        allowClear
                        onChange={handleStatusChange}
                    >
                        <Option value="pending">Pending</Option>
                        <Option value="processing">Processing</Option>
                        <Option value="ready">Ready</Option>
                        <Option value="out_for_delivery">Out for Delivery</Option>
                        <Option value="delivered">Delivered</Option>
                        <Option value="cancelled">Cancelled</Option>
                    </Select>
                    <Button
                        icon={<FilterOutlined />}
                        onClick={() => fetchOrders()}
                    >
                        Refresh
                    </Button>
                </Space>
            </Card>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                bordered
            />
        </div>
    );
};

export default OrdersList;
