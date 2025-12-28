import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Typography,
  Card,
  Input,
  Select,
  DatePicker,
  Space,
  Pagination,
  Empty,
  message,
  Skeleton
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { ordersAPI } from '../../../services/api';
import './styles.css';

const { Title, Text } = Typography;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const response = await ordersAPI.getAll(current, pageSize);
      
      setOrders(response.data.docs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalDocs || 0,
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const getStatusTag = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'processing':
        return <Tag icon={<ClockCircleOutlined />} color="processing">Processing</Tag>;
      case 'cancelled':
        return <Tag icon={<CloseCircleOutlined />} color="error">Cancelled</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => `#${text}`,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      render: (amount) => `$${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/customer/orders/${record._id}`)}
        >
          View Details <ArrowRightOutlined />
        </Button>
      ),
    },
  ];

  // Mock data for development
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'ORD-2023-001',
      createdAt: new Date(),
      items: [{}, {}],
      totalAmount: 45.99,
      status: 'processing',
    },
    {
      _id: '2',
      orderNumber: 'ORD-2023-002',
      createdAt: new Date(Date.now() - 86400000),
      items: [{}],
      totalAmount: 25.50,
      status: 'completed',
    },
  ];

  const data = process.env.NODE_ENV === 'development' && orders.length === 0 ? mockOrders : orders;

  return (
    <div className="orders-page">
      <div className="page-header">
        <Title level={2}>My Orders</Title>
        <Text type="secondary">View and track your orders</Text>
      </div>

      <Card className="orders-card">
        {loading && orders.length === 0 ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : data.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>You haven't placed any orders yet</span>
            }
          >
            <Button 
              type="primary" 
              onClick={() => navigate('/medicines')}
              icon={<ShoppingCartOutlined />}
            >
              Start Shopping
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
};

export default OrdersPage;
