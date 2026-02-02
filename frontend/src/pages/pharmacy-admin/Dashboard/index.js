import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Typography, Avatar, Space, Spin, Alert, Badge } from 'antd';
import {
  ShopOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  NotificationOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import pharmacyAdminService from '../../../services/pharmacyAdminService';
import './Dashboard.css';

const { Title, Text } = Typography;

const PharmacyAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, alertsRes] = await Promise.all([
        pharmacyAdminService.getDashboardStats(),
        pharmacyAdminService.getAlerts()
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { pharmacies, subscriptions, recentActivity } = stats;

  const quickActions = [
    {
      title: 'Pending Requests',
      icon: <SolutionOutlined />,
      color: '#faad14',
      bgColor: 'rgba(250, 173, 20, 0.1)',
      count: pharmacies.pending,
      action: () => navigate('/pharmacy-admin/registration')
    },
    {
      title: 'Manage Subscriptions',
      icon: <CrownOutlined />,
      color: '#722ed1',
      bgColor: 'rgba(114, 46, 209, 0.1)',
      action: () => navigate('/pharmacy-admin/subscriptions')
    },
    {
      title: 'Pharmacy Control',
      icon: <ShopOutlined />,
      color: '#1890ff',
      bgColor: 'rgba(24, 144, 255, 0.1)',
      action: () => navigate('/pharmacy-admin/pharmacy-control')
    },
    {
      title: 'View Reports',
      icon: <NotificationOutlined />,
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.1)',
      action: () => navigate('/pharmacy-admin/reports')
    },
  ];

  return (
    <div className="pharmacy-admin-dashboard" style={{ padding: '24px' }}>
      <div className="welcome-section">
        <Title level={2} style={{ marginBottom: '8px' }}>Welcome back! 👋</Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>Platform-wide pharmacy administration overview</Text>
      </div>

      {/* Stats Banner Mini */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col span={24}>
          <div className="stats-banner-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Total Pharmacies</Text>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{pharmacies.total}</Title>
            </div>
            <div className="banner-divider" />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Active</Text>
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{pharmacies.active}</Title>
            </div>
            <div className="banner-divider" />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Suspended</Text>
              <Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>{pharmacies.suspended}</Title>
            </div>
            <div className="banner-divider" />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Pending</Text>
              <Title level={2} style={{ margin: 0, color: '#faad14' }}>{pharmacies.pending}</Title>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              message={alert.message}
              type={alert.severity === 'error' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
              showIcon
              closable
              style={{ marginBottom: '12px' }}
              action={
                <Button
                  size="small"
                  onClick={() => {
                    if (alert.type === 'near_expiry_license' || alert.type === 'expired_license') {
                      navigate('/pharmacy-admin/pharmacy-control');
                    } else if (alert.type === 'pending_registration') {
                      navigate('/pharmacy-admin/registration');
                    } else if (alert.type.includes('subscription')) {
                      navigate('/pharmacy-admin/subscriptions');
                    }
                  }}
                >
                  Take Action
                </Button>
              }
            />
          ))}
        </div>
      )}

      <div className="section-title">Quick Actions</div>
      <Row gutter={[16, 16]} style={{ marginBottom: '40px' }}>
        {quickActions.map((action, index) => (
          <Col xs={12} md={6} key={index}>
            <Card className="quick-action-card-refined" hoverable onClick={action.action}>
              <div className="action-icon-refined" style={{ background: action.bgColor, color: action.color }}>
                {action.icon}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text strong>{action.title}</Text>
                {action.count > 0 ? (
                  <Badge count={action.count} overflowCount={9} style={{ backgroundColor: action.color }} />
                ) : (
                  <RightOutlined style={{ fontSize: '12px', color: '#94A3B8' }} />
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-card"
            title={<Title level={4} style={{ margin: 0 }}>Subscription Plans</Title>}
            extra={<Button type="link" onClick={() => navigate('/pharmacy-admin/subscriptions')}>View All</Button>}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <Statistic
                title="Active Subscriptions"
                value={subscriptions.active}
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="Monthly Revenue"
                value={subscriptions.monthlyRevenue}
                prefix="ETB"
                valueStyle={{ color: '#1890ff' }}
              />
            </div>
            {subscriptions.expiring > 0 && (
              <Alert
                message={`${subscriptions.expiring} subscription expiring soon`}
                type="warning"
                showIcon
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="dashboard-card"
            title={<Title level={4} style={{ margin: 0 }}>Recent Activity</Title>}
            extra={<Button type="link" onClick={() => navigate('/pharmacy-admin/registration')}>Review</Button>}
          >
            {recentActivity && recentActivity.length > 0 ? (
              <List
                dataSource={recentActivity}
                renderItem={(item) => (
                  <List.Item className="dashboard-list-item">
                    <List.Item.Meta
                      avatar={<Avatar shape="square" icon={<ShopOutlined />} style={{ backgroundColor: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }} />}
                      title={item.pharmacyName}
                      description={
                        <Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>{item.email}</Text>
                          <Tag color="orange" size="small">{item.status}</Tag>
                        </Space>
                      }
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No recent registration activity</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PharmacyAdminDashboard;
