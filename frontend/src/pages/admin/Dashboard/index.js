import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Button, Typography, Alert, List, Avatar, Skeleton, message, Space } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  SafetyOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;

const AdminDashboard = () => {
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

  // Use real data or fallbacks
  const stats = data?.stats || {
    totalUsers: 0,
    activePharmacies: 0,
    totalOrders: 0,
    totalRevenue: 0,
    healthScore: 100
  };

  const userGrowthData = data?.userGrowth || [];
  const orderStatusData = data?.orderStatus || [];
  const securityAlerts = data?.alerts || [];
  const revenueData = data?.weeklyRevenue || [];

  return (
    <div className="admin-dashboard fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>System Overview</Title>
          <Text type="secondary">Real-time platform insights and health check</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>Refresh</Button>
          <Tag color="success" style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '6px' }}>
            <SafetyOutlined /> Health Score: {stats.healthScore || 100}%
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

      {/* Stats Widgets */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable className="premium-card">
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#4361ee' }} />}
              valueStyle={{ color: '#1e293b' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <Text type="success"><ArrowUpOutlined /> 12% </Text>
              <Text type="secondary">vs last month</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable className="premium-card">
            <Statistic
              title="Active Pharmacies"
              value={stats.activePharmacies}
              prefix={<ShopOutlined style={{ color: '#06d6a0' }} />}
              valueStyle={{ color: '#1e293b' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <Text type="success"><ArrowUpOutlined /> 5% </Text>
              <Text type="secondary">new registrations</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable className="premium-card">
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#1e293b' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <Text type="warning">Active: 12</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card bordered={false} hoverable className="premium-card">
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#ef476f' }} />}
              suffix="ETB"
              valueStyle={{ color: '#1e293b' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <Text type="success"><ArrowUpOutlined /> 8.4% </Text>
              <Text type="secondary">revenue growth</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={24} xl={4}>
          <Card bordered={false} className="alert-summary-card" style={{ background: '#fff1f0' }}>
            <Statistic
              title="Critical Alerts"
              value={3}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Button type="link" size="small" danger style={{ padding: 0 }}>Review Logs</Button>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="User Acquisition Trend" bordered={false} className="premium-card">
            <div style={{ width: '100%', height: 300 }}>
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
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#4361ee" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Order Status Breakdown" bordered={false} className="premium-card">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={orderStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
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
          <Card title="Weekly Revenue Performance (ETB)" bordered={false} className="premium-card">
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#06d6a0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Security & System Alerts Panel */}
        <Col xs={24} lg={12}>
          <Card title="Forensic Security Logs" extra={<Button type="link">Expand Security Center</Button>} bordered={false} className="premium-card">
            <List
              itemLayout="horizontal"
              dataSource={securityAlerts}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={item.type === 'critical' ? <SafetyOutlined /> : <WarningOutlined />}
                        style={{ backgroundColor: item.type === 'critical' ? '#ff4d4f' : '#faad14' }} />
                    }
                    title={<span style={{ color: item.type === 'critical' ? '#cf1322' : 'inherit', fontWeight: 500 }}>{item.message}</span>}
                    description={
                      <Space>
                        <Text type="secondary">{item.time}</Text>
                        <Tag size="small" color={item.type === 'critical' ? 'red' : 'orange'}>{item.type.toUpperCase()}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .premium-card {
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          transition: transform 0.2s ease-in-out;
        }
        .premium-card:hover {
          transform: translateY(-2px);
        }
        .alert-summary-card {
          border-radius: 12px;
          border-left: 4px solid #f5222d !important;
        }
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
