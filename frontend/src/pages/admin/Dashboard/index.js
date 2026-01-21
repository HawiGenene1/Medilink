
import React from 'react';
import { Row, Col, Card, Statistic, Tag, Button, Typography, Alert, List, Avatar } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  SafetyOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const { Title, Text } = Typography;

const AdminDashboard = () => {

  // Mock Data for Widgets
  const stats = {
    totalUsers: 12543,
    activePharmacies: 142,
    ordersToday: 345,
    revenueMonth: 1258000, // in Birr
    healthScore: 98
  };

  // Mock Data for Charts
  const userGrowthData = [
    { name: 'Jan', users: 4000 },
    { name: 'Feb', users: 4500 },
    { name: 'Mar', users: 5000 },
    { name: 'Apr', users: 6200 },
    { name: 'May', users: 7800 },
    { name: 'Jun', users: 9000 },
    { name: 'Jul', users: 12543 },
  ];

  const revenueData = [
    { name: 'Mon', revenue: 45000 },
    { name: 'Tue', revenue: 52000 },
    { name: 'Wed', revenue: 49000 },
    { name: 'Thu', revenue: 63000 },
    { name: 'Fri', revenue: 58000 },
    { name: 'Sat', revenue: 71000 },
    { name: 'Sun', revenue: 65000 },
  ];

  const orderStatusData = [
    { name: 'Completed', value: 2400 },
    { name: 'Pending', value: 450 },
    { name: 'Cancelled', value: 120 },
  ];

  // Mock Data for Alerts
  const securityAlerts = [
    { type: 'error', message: 'Multiple failed login attempts detected from IP 192.168.1.1', time: '10 mins ago' },
    { type: 'warning', message: 'High latency observed in Payment Gateway Service', time: '45 mins ago' },
    { type: 'info', message: 'New Pharmacy "Bole Meds" request awaiting approval', time: '1 hour ago' },
  ];

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>System Overview</Title>
          <Text type="secondary">Real-time platform insights and health check</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Tag color="success" style={{ padding: '6px 12px', fontSize: '14px' }}>
            <SafetyOutlined /> Health Score: {stats.healthScore}%
          </Tag>
        </div>
      </div>

      {/* Stats Widgets */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<span style={{ fontSize: '12px', color: '#3f8600' }}><ArrowUpOutlined /> 12%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Active Pharmacies"
              value={stats.activePharmacies}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<span style={{ fontSize: '12px', color: '#1890ff' }}><ArrowUpOutlined /> 5%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Orders Today"
              value={stats.ordersToday}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Revenue (Month)"
              value={stats.revenueMonth}
              precision={2}
              prefix="ETB"
              groupSeparator=","
              valueStyle={{ color: '#0050b3' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={24} xl={4}>
          {/* System Alert Summary Widget */}
          <Card bordered={false} style={{ background: '#fff1f0', borderColor: '#ffa39e' }} bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#cf1322' }}>Critical Alerts</span>}
              value={3}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Button type="link" size="small" danger style={{ padding: 0 }}>View Security Log</Button>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="User Growth Trend" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#4361ee" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Order Status Distribution" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={orderStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4361ee" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Revenue Trend */}
        <Col xs={24} lg={12}>
          <Card title="Weekly Revenue Trend (ETB)" bordered={false}>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3f8600" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Security & System Alerts Panel */}
        <Col xs={24} lg={12}>
          <Card title="System Alerts & Security" extra={<Button type="link">View All Logs</Button>} bordered={false}>
            <List
              itemLayout="horizontal"
              dataSource={securityAlerts}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={item.type === 'error' ? <SafetyOutlined /> : <WarningOutlined />}
                        style={{ backgroundColor: item.type === 'error' ? '#ff4d4f' : '#faad14' }} />
                    }
                    title={<span style={{ color: item.type === 'error' ? '#cf1322' : 'inherit' }}>{item.message}</span>}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
