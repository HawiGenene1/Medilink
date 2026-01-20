
import React from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Typography, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ShopOutlined, ShoppingCartOutlined, DollarOutlined, AlertOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const PharmacyDashboard = () => {
  const navigate = useNavigate();

  // Mock Data
  const stats = {
    todaySales: 2500,
    monthSales: 45000,
    pendingOrders: 5,
    lowStockItems: 3
  };

  const lowStockItems = [
    { name: 'Amoxicillin 500mg', stock: 5 },
    { name: 'Ibuprofen 400mg', stock: 2 },
    { name: 'Omeprazole 20mg', stock: 0 },
  ];

  const recentOrders = [
    { id: '#1023', customer: 'Abebe B.', items: 3, total: 450, status: 'Pending' },
    { id: '#1022', customer: 'Sara K.', items: 1, total: 120, status: 'Completed' },
    { id: '#1021', customer: 'Kebede T.', items: 5, total: 890, status: 'Processing' },
  ];

  return (
    <div className="pharmacy-dashboard">
      <Title level={2}>Pharmacy Dashboard</Title>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Today's Sales"
              value={stats.todaySales}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="ETB"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Orders (Month)"
              value={156}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Pending Orders"
              value={stats.pendingOrders}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Low Stock Alerts"
              value={stats.lowStockItems}
              valueStyle={{ color: '#cf1322' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Recent Orders */}
        <Col xs={24} lg={14}>
          <Card title="Recent Orders" extra={<Button type="link" onClick={() => navigate('/pharmacy-staff/orders')}>View All</Button>}>
            <List
              itemLayout="horizontal"
              dataSource={recentOrders}
              renderItem={item => (
                <List.Item
                  actions={[<Button type="link" key="view">View</Button>]}
                >
                  <List.Item.Meta
                    avatar={<ShoppingCartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={`Order ${item.id} - ${item.customer}`}
                    description={`${item.items} items • ETB ${item.total}`}
                  />
                  <Tag color={item.status === 'Completed' ? 'green' : (item.status === 'Pending' ? 'orange' : 'blue')}>
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Inventory Alerts */}
        <Col xs={24} lg={10}>
          <Card title="Inventory Alerts" extra={<Button type="link" onClick={() => navigate('/pharmacy-staff/inventory')}>Manage Inventory</Button>}>
            <List
              dataSource={lowStockItems}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text type="danger">{item.name}</Text>}
                    description={`Only ${item.stock} left in stock`}
                  />
                  <Button size="small" danger>Restock</Button>
                </List.Item>
              )}
            />
            <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
              <Text strong>System Status</Text>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Server Connectivity</span>
                  <Text type="success">Online</Text>
                </div>
                <Progress percent={100} showInfo={false} strokeColor="#52c41a" size="small" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PharmacyDashboard;
