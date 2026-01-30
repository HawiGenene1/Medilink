import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Tabs, Progress, Timeline, Modal, Divider, Spin, Result } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../../services/api/orders';
import './Orders.css';

const { Title, Text } = Typography;

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getMyOrders();
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'processing',
      'preparing': 'processing',
      'ready': 'processing',
      'in_transit': 'processing',
      'delivered': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getOrderProgress = (status) => {
    const progress = {
      'pending': 10,
      'confirmed': 25,
      'preparing': 50,
      'ready': 75,
      'in_transit': 90,
      'delivered': 100
    };
    return progress[status] || 0;
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsVisible(true);
  };

  const OrderCard = ({ order, isActive }) => (
    <Card className="order-main-card" style={{ marginBottom: '20px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Space size="middle">
            <Avatar shape="square" size={48} icon={<ShopOutlined />} style={{ background: '#E3F2FD', color: '#1E88E5' }} />
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Order #: {order.orderNumber}</Text>
              <Title level={4} style={{ margin: 0 }}>{order.pharmacy?.name || 'Pharmacy'}</Title>
            </div>
          </Space>
        </Col>
        <Col style={{ textAlign: 'right' }}>
          <Tag color={getStatusColor(order.status)} style={{ marginRight: 0 }}>{(order.status || 'pending').toUpperCase().replace('_', ' ')}</Tag>
          <div style={{ marginTop: '4px' }}><Text type="secondary">{new Date(order.createdAt).toLocaleDateString()}</Text></div>
        </Col>
      </Row>

      <Row gutter={40}>
        <Col xs={24} md={16}>
          <div className="order-items-preview">
            <Space size="middle">
              <div className="item-qty-badge">{order.items?.length || 0} Items</div>
              <Text strong style={{ fontSize: '16px' }}>Total: {order.finalAmount} ETB</Text>
            </Space>
          </div>

          {isActive && (
            <div className="order-track-progress" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>{(order.status || 'pending').toUpperCase().replace('_', ' ')}</Text>
                <Text>{getOrderProgress(order.status)}%</Text>
              </div>
              <Progress percent={getOrderProgress(order.status)} strokeColor="#1E88E5" showInfo={false} />
            </div>
          )}
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px' }}>
          <Button block icon={<FileTextOutlined />} onClick={() => handleViewDetails(order)}>View Details</Button>
          {(isActive || order.status === 'delivered') && (
            <Button type="primary" block icon={<EnvironmentOutlined />} onClick={() => navigate(`/customer/orders/track/${order._id}`)}>
              Track Live
            </Button>
          )}
        </Col>
      </Row>
    </Card>
  );

  const tabsItems = [
    {
      key: '1',
      label: `Active Orders (${activeOrders.length})`,
      children: (
        <div className="orders-list-wrapper">
          {loading ? <Spin /> : activeOrders.length > 0 ? activeOrders.map(order => <OrderCard key={order._id} order={order} isActive={true} />) : <Result status="info" title="No active orders" />}
        </div>
      )
    },
    {
      key: '2',
      label: `Order History (${pastOrders.length})`,
      children: (
        <div className="orders-list-wrapper">
          {loading ? <Spin /> : pastOrders.length > 0 ? pastOrders.map(order => <OrderCard key={order._id} order={order} isActive={false} />) : <Result status="info" title="No past orders" />}
        </div>
      )
    }
  ];

  return (
    <div className="orders-page-container fade-in">
      <div className="orders-header" style={{ marginBottom: '32px' }}>
        <Title level={2}>My Orders</Title>
        <Text type="secondary">Manage your active and completed medical orders</Text>
      </div>

      <Tabs defaultActiveKey="1" items={tabsItems} className="clinical-tabs" />

      <Modal
        title={`Order Details - ${selectedOrder?.id}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>Close</Button>,
          selectedOrder?.status === 'Delivered' && <Button key="reorder" type="primary">Reorder Items</Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary">Pharmacy</Text>
                <Title level={4} style={{ margin: 0 }}>{selectedOrder.pharmacy}</Title>
              </div>
              <Tag color={selectedOrder.statusColor}>{selectedOrder.status}</Tag>
            </div>

            <Title level={5}>Order Items</Title>
            <List
              itemLayout="horizontal"
              dataSource={[
                { name: 'Amoxicillin 500mg', qty: 2, price: '120 ETB' },
                { name: 'Paracetamol 500mg', qty: 1, price: '40 ETB' }
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }} />}
                    title={item.name}
                    description={`Quantity: ${item.qty}`}
                  />
                  <div>{item.price}</div>
                </List.Item>
              )}
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <Row justify="space-between" style={{ marginBottom: '8px' }}>
                <Text>Subtotal</Text>
                <Text strong>160 ETB</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: '8px' }}>
                <Text>Delivery Fee</Text>
                <Text strong>50 ETB</Text>
              </Row>
              <Row justify="space-between">
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#1E88E5' }}>{selectedOrder.total}</Title>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
