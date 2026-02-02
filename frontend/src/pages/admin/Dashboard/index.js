import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Alert, List, Avatar, Skeleton, message, Space, Tag } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  SafetyOutlined,
  WarningOutlined,
  ReloadOutlined,

  FileSearchOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import adminService from '../../../services/api/admin';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="admin-dashboard-loading">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const stats = data?.stats || {
    totalUsers: 0,
    activePharmacies: 0,
    totalOrders: 0,
    totalRevenue: 0,
    healthScore: 100,
    activeSubscriptions: 0,
    expiringSubscriptions: 0
  };

  const userGrowthData = data?.userGrowth || [];
  const orderStatusData = data?.orderStatus || [];
  const systemLogs = data?.alerts || [];
  const revenueData = data?.weeklyRevenue || [];

  // Mock Critical Alerts (since backend only returns logs currently)
  const criticalAlerts = [
    { type: 'critical', message: 'Payment service timeout', time: '10:45 AM' },
    { type: 'warning', message: 'High CPU usage detected (85%)', time: '11:20 AM' },
    { type: 'critical', message: 'Backup failed (DB_PRIMARY)', time: '03:15 AM' }
  ];



  return (
    <div className="admin-dashboard fade-in">
      {/* Header Section */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} className="dashboard-title" style={{ marginBottom: 0 }}>System Overview</Title>
          <Text type="secondary">Real-time platform insights and system monitoring</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>Refresh</Button>
          <Tag color={stats.healthScore > 90 ? 'success' : 'warning'} style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '8px', fontWeight: 600 }}>
            <SafetyOutlined /> Platform Health: {stats.healthScore}%
          </Tag>
        </div>
      </div>

      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* A. System Overview Cards */}
      <Title level={4} style={{ marginBottom: '16px', color: '#64748b' }}>System Metrics</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Total Users */}
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} hoverable className="premium-card oversight-card">
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#4361ee' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Active Pharmacies */}
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} hoverable className="premium-card oversight-card">
            <Statistic
              title="Active Pharmacies"
              value={stats.activePharmacies}
              prefix={<ShopOutlined style={{ color: '#06d6a0' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Total Orders (Read Only) */}
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} hoverable className="premium-card oversight-card">
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Total Revenue (Read Only) */}
        <Col xs={24} sm={12} lg={5}>
          <Card bordered={false} hoverable className="premium-card oversight-card">
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#ef476f' }} />}
              suffix="ETB"
              valueStyle={{ color: '#1e293b', fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Expiring Subscriptions */}
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} hoverable className="premium-card oversight-card" style={{ borderLeft: '4px solid #ff9f43' }}>
            <Statistic
              title="Expiring Subs"
              value={stats.expiringSubscriptions}
              prefix={<ClockCircleOutlined style={{ color: '#ff9f43' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Platform Health Card (redundant with header tag but requested) */}
        <Col xs={24} sm={12} lg={3}>
          <Card bordered={false} hoverable className="premium-card oversight-card">
            <Statistic
              title="Health"
              value={stats.healthScore}
              suffix="%"
              prefix={<SafetyOutlined style={{ color: '#389e0d' }} />}
              valueStyle={{ color: '#389e0d', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* B. Critical Alerts Panel */}
        <Col xs={24} lg={8}>
          <Card
            title={<Space><WarningOutlined style={{ color: '#f5222d' }} /> Critical System Alerts</Space>}
            bordered={false}
            className="premium-card alert-panel-card"
            style={{ height: '100%', border: '1px solid #ffccc7', background: '#fff2f0' }}
          >
            <List
              dataSource={criticalAlerts}
              renderItem={item => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,0,0,0.1)' }}>
                  <List.Item.Meta
                    avatar={<ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: '20px' }} />}
                    title={<Text strong style={{ color: '#cf1322' }}>{item.message}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
            <Button type="primary" danger ghost block style={{ marginTop: '16px' }} onClick={() => navigate('/admin/notifications')}>View All Alerts</Button>
          </Card>
        </Col>

        {/* C. Analytics & Charts */}
        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            {/* User Growth */}
            <Col span={24}>
              <Card
                title={<Space><LineChartOutlined /> User Growth Trend</Space>}
                bordered={false}
                className="premium-card"
                extra={<Tag color="blue">Monitoring</Tag>}
              >
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="users" stroke="#4361ee" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* Order Status Distribution */}
            <Col span={12}>
              <Card title="Order Status (Distribution)" bordered={false} className="premium-card">
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={orderStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#4361ee" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* Weekly Revenue */}
            <Col span={12}>
              <Card title="Weekly Revenue (Read-only)" bordered={false} className="premium-card">
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#06d6a0" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* D. System Activity Trail / Logs */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title={<Space><FileSearchOutlined /> System Activity Trail</Space>}
            extra={<Button type="link" onClick={() => navigate('/admin/audit')}>View Full Logs</Button>}
            bordered={false}
            className="premium-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={systemLogs}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={item.type === 'critical' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                        style={{ backgroundColor: item.type === 'critical' ? '#ff4d4f' : '#52c41a' }} />
                    }
                    title={<span style={{ fontWeight: 600 }}>{item.message}</span>}
                    description={
                      <Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>
                        <Tag size="small">{item.type.toUpperCase()}</Tag>
                      </Space>
                    }
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
