import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Tabs, Progress, Timeline, Modal, Divider } from 'antd';
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
import './Orders.css';

const { Title, Text } = Typography;

const Orders = () => {
  const navigate = useNavigate();

  const activeOrders = [
    {
      id: 'ORD-1024',
      pharmacy: 'Kenema Pharmacy No. 4',
      status: 'Out for Delivery',
      statusColor: 'processing',
      itemCount: 3,
      total: '210 ETB',
      date: 'Today, 2:30 PM',
      progress: 75
    },
    {
      id: 'ORD-1022',
      pharmacy: 'City Central Pharma',
      status: 'Processing',
      statusColor: 'warning',
      itemCount: 1,
      total: '80 ETB',
      date: 'Today, 10:15 AM',
      progress: 30
    }
  ];

  const pastOrders = [
    {
      id: 'ORD-0950',
      pharmacy: 'Red Cross Pharmacy',
      status: 'Delivered',
      statusColor: 'success',
      itemCount: 2,
      total: '450 ETB',
      date: 'Jan 15, 2026'
    },
    {
      id: 'ORD-0942',
      pharmacy: 'Kenema Pharmacy',
      status: 'Delivered',
      statusColor: 'success',
      itemCount: 5,
      total: '1,200 ETB',
      date: 'Jan 12, 2026'
    }
  ];

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
              <Text type="secondary" style={{ fontSize: '12px' }}>Order ID: {order.id}</Text>
              <Title level={4} style={{ margin: 0 }}>{order.pharmacy}</Title>
            </div>
          </Space>
        </Col>
        <Col style={{ textAlign: 'right' }}>
          <Tag color={order.statusColor} style={{ marginRight: 0 }}>{order.status}</Tag>
          <div style={{ marginTop: '4px' }}><Text type="secondary">{order.date}</Text></div>
        </Col>
      </Row>

      <Row gutter={40}>
        <Col xs={24} md={16}>
          <div className="order-items-preview">
            <Space size="middle">
              <div className="item-qty-badge">{order.itemCount} Items</div>
              <Text strong style={{ fontSize: '16px' }}>Total: {order.total}</Text>
            </Space>
          </div>

          {isActive && (
            <div className="order-track-progress" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>{order.status}</Text>
                <Text>{order.progress}%</Text>
              </div>
              <Progress percent={order.progress} strokeColor="#1E88E5" showInfo={false} />
            </div>
          )}
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px' }}>
          <Button block icon={<FileTextOutlined />} onClick={() => handleViewDetails(order)}>View Details</Button>
          {isActive ? (
            <Button type="primary" block icon={<EnvironmentOutlined />} onClick={() => navigate(`/customer/orders/track/${order.id}`)}>
              Track Live
            </Button>
          ) : (
            <Button type="primary" block icon={<ShoppingCartOutlined />}>Reorder</Button>
          )}
        </Col>
      </Row>
    </Card>
  );

  const tabsItems = [
    {
      key: '1',
      label: 'Active Orders',
      children: (
        <div className="orders-list-wrapper">
          {activeOrders.map(order => <OrderCard key={order.id} order={order} isActive={true} />)}
        </div>
      )
    },
    {
      key: '2',
      label: 'Order History',
      children: (
        <div className="orders-list-wrapper">
          {pastOrders.map(order => <OrderCard key={order.id} order={order} isActive={false} />)}
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
