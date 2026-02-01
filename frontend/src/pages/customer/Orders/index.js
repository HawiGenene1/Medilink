import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Tabs, Progress, Modal, Divider, Empty, Spin, message } from 'antd';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  DownloadOutlined,
  SyncOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, paymentsAPI } from '../../../services/api';
import './Orders.css';

const { Title, Text } = Typography;

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll(1, 100);
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      message.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'refunded'].includes(o.status));

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'blue';
      case 'preparing': return 'processing';
      case 'ready': return 'purple';
      case 'out_for_delivery': return 'processing';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getProgress = (status) => {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 30;
      case 'preparing': return 50;
      case 'ready': return 70;
      case 'out_for_delivery': return 90;
      case 'delivered': return 100;
      default: return 0;
    }
  };

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
              <Text type="secondary" style={{ fontSize: '12px' }}>Order ID: {order.orderNumber}</Text>
              <Title level={4} style={{ margin: 0 }}>{order.pharmacy?.name || 'Local Pharmacy'}</Title>
            </div>
          </Space>
        </Col>
        <Col style={{ textAlign: 'right' }}>
          <Tag color={getStatusColor(order.status)} style={{ marginRight: 0 }}>{order.status.toUpperCase()}</Tag>
          <div style={{ marginTop: '4px' }}><Text type="secondary">{new Date(order.createdAt).toLocaleDateString()}</Text></div>
        </Col>
      </Row>

      <Row gutter={40}>
        <Col xs={24} md={16}>
          <div className="order-items-preview">
            <Space size="middle">
              <div className="item-qty-badge">{order.items?.length || 0} Items</div>
              <Text strong style={{ fontSize: '16px' }}>Total: {order.finalAmount?.toFixed(2)} ETB</Text>
            </Space>
          </div>

          {isActive && (
            <div className="order-track-progress" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text>{getProgress(order.status)}%</Text>
              </div>
              <Progress percent={getProgress(order.status)} strokeColor="#1E88E5" showInfo={false} />
            </div>
          )}
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px' }}>
          <Button block icon={<FileTextOutlined />} onClick={() => handleViewDetails(order)}>View Details</Button>
          {(order.status === 'out_for_delivery' || order.status === 'ready') ? (
            <Button type="primary" block icon={<EnvironmentOutlined />} onClick={() => navigate(`/customer/orders/track/${order._id}`)}>
              Track Live
            </Button>
          ) : (
            <Button type="primary" block icon={<ShoppingCartOutlined />} disabled={order.status === 'pending'}>Reorder</Button>
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
          {activeOrders.length > 0 ? activeOrders.map(order => <OrderCard key={order._id} order={order} isActive={true} />) : <Empty description="No active orders" />}
        </div>
      )
    },
    {
      key: '2',
      label: 'Order History',
      children: (
        <div className="orders-list-wrapper">
          {pastOrders.length > 0 ? pastOrders.map(order => <OrderCard key={order._id} order={order} isActive={false} />) : <Empty description="No past orders" />}
        </div>
      )
    }
  ];

  const handleSyncReceipt = async (orderId) => {
    try {
      setLoading(true);
      const response = await paymentsAPI.syncReceipt(orderId);
      if (response.data.success) {
        message.success('Receipt synced successfully!');
        fetchOrders(); // Refresh order local state
        // Update selected order in modal if it's the one we just synced
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            paymentDetails: response.data.data,
            paymentStatus: 'paid'
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      message.error(error.response?.data?.message || 'Failed to sync receipt. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChapaReceipt = () => {
    const ref = selectedOrder?.paymentDetails?.chapaReference;
    if (ref) {
      window.open(`https://chapa.link/payment-receipt/${ref}`, '_blank');
    } else {
      if (selectedOrder?.paymentMethod === 'cash') {
        message.info('This order was paid by Cash. Official Chapa receipts are only available for online payments.');
      } else {
        message.warning('Official Chapa reference ID not found. Use "Sync Receipt" to recover it.');
      }
    }
  };

  const modalFooter = [
    <Button key="close" onClick={() => setDetailsVisible(false)}>Close</Button>,
    selectedOrder?.paymentStatus === 'paid' && (
      <Button
        key="invoice"
        type="primary"
        icon={<FileTextOutlined />}
        onClick={() => navigate(`/customer/orders/${selectedOrder._id}/invoice`)}
      >
        View Invoice
      </Button>
    ),
    selectedOrder?.paymentStatus === 'paid' &&
    selectedOrder?.paymentMethod === 'chapa' &&
    !selectedOrder?.paymentDetails?.chapaReference && (
      <Button
        key="sync"
        onClick={() => handleSyncReceipt(selectedOrder?._id)}
        icon={<SyncOutlined />}
        loading={loading}
      >
        Sync Receipt
      </Button>
    ),
    selectedOrder?.paymentStatus === 'paid' &&
    selectedOrder?.paymentMethod === 'chapa' &&
    selectedOrder?.paymentDetails?.chapaReference && (
      <Button
        key="chapa"
        icon={<DownloadOutlined />}
        onClick={handleOpenChapaReceipt}
        className="chapa-receipt-btn"
        style={{ backgroundColor: '#00af41', color: '#fff', border: 'none' }}
      >
        Official Chapa Receipt
      </Button>
    ),
    selectedOrder?.status === 'delivered' && <Button key="reorder" type="primary">Reorder Items</Button>
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      <div className="orders-header">
        <Title level={2}>My Orders</Title>
        <Text type="secondary">Manage and track your medication orders</Text>
      </div>

      <Tabs defaultActiveKey="1" items={tabsItems} className="orders-tabs" />

      <Modal
        title={`Order Details - ${selectedOrder?.orderNumber}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={modalFooter}
        width={600}
      >
        {selectedOrder && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary">Pharmacy</Text>
                <Title level={4} style={{ margin: 0 }}>{selectedOrder.pharmacy?.name || 'Local Pharmacy'}</Title>
              </div>
              <Space direction="vertical" align="end">
                <Tag color={getStatusColor(selectedOrder.status)}>{selectedOrder.status.toUpperCase()}</Tag>
                <Tag color={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {selectedOrder.paymentStatus.toUpperCase()}
                </Tag>
              </Space>
            </div>

            <Title level={5}>Order Items</Title>
            <List
              itemLayout="horizontal"
              dataSource={selectedOrder.items || []}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }} />}
                    title={item.name}
                    description={`Quantity: ${item.quantity}`}
                  />
                  <div>{item.price?.toFixed(2) || item.subtotal?.toFixed(2)} ETB</div>
                </List.Item>
              )}
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <Row justify="space-between" style={{ marginBottom: '8px' }}>
                <Text>Subtotal</Text>
                <Text strong>{selectedOrder.totalAmount?.toFixed(2)} ETB</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: '8px' }}>
                <Text>Delivery Fee</Text>
                <Text strong>{selectedOrder.deliveryFee?.toFixed(2)} ETB</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: '8px' }}>
                <Text>Tax</Text>
                <Text strong>{selectedOrder.tax?.toFixed(2)} ETB</Text>
              </Row>
              <Row justify="space-between">
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#1E88E5' }}>{selectedOrder.finalAmount?.toFixed(2)} ETB</Title>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
