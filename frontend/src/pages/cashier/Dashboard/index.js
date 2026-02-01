import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Button, Tabs, message, Space, Tooltip, Modal, Form, Input, DatePicker, Descriptions, Divider, Badge, Select, List, Avatar, Progress, Alert, Upload, Switch } from 'antd';
import {
  SearchOutlined,
  SyncOutlined,
  EyeOutlined,
  FilePdfOutlined,
  WalletOutlined,
  AreaChartOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  BellOutlined,
  RightOutlined,
  ReloadOutlined,
  CameraOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  LockOutlined,
  WarningOutlined,
  StopOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { cashierAPI } from '../../../services/api/cashier';
import cashierPOSService from '../../../services/cashierPOS';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './CashierDashboard.css';
import dayjs from 'dayjs';
import ShiftManagement from './ShiftManagement';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

const CashierDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, updateProfile, uploadAvatar } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    failed: 0,
    systemStatus: 'online'
  });
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.notificationsEnabled ?? true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(user?.settings?.autoRefresh ?? true);

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cashier/pending')) setActiveTab('approved');
    else if (path.includes('/cashier/transactions')) setActiveTab('monitor');
    else if (path.includes('/cashier/settings') || path.includes('/cashier/profile')) setActiveTab('settings');
    else if (path.includes('/cashier/notifications')) setActiveTab('notifications');
    else setActiveTab('dashboard');
  }, [location.pathname]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Action States
  const [verifyingId, setVerifyingId] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // POS Features
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'dashboard' && autoRefreshEnabled) {
      const interval = setInterval(() => {
        fetchStatsOnly();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, pagination.current, searchText, dateRange, statusFilter, autoRefreshEnabled]);

  const fetchStatsOnly = async () => {
    try {
      const statsRes = await cashierAPI.getStats();
      if (statsRes.data.success) {
        const data = statsRes.data.data;
        setStats({
          pending: data.pendingCount || data.pending || 0,
          paid: data.paidCount || data.paid || 0,
          failed: data.failedCount || data.failed || 0,
          systemStatus: data.systemStatus || 'online'
        });
      }
    } catch (error) {
      // Silently fail for background refreshes unless critical
      console.error('Auto-refresh stats error:', error.message);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Shift & Alerts
      try {
        const [shiftRes, alertsRes] = await Promise.all([
          cashierPOSService.getCurrentShift(),
          cashierPOSService.getAlerts()
        ]);
        if (shiftRes.data.success) setCurrentShift(shiftRes.data.data);
        if (alertsRes.data.success) setAlerts(alertsRes.data.data || []);
      } catch (err) {
        console.error('Initial metadata fetch err:', err.message);
      }

      // Content based on active tab
      if (activeTab === 'dashboard') {
        const todayStatsRes = await cashierPOSService.getTodayStats();
        if (todayStatsRes.data.success) {
          const data = todayStatsRes.data.data;
          setStats({
            pending: data.pendingPayments || 0,
            paid: data.transactionCount || 0,
            failed: data.failedPayments || 0,
            systemStatus: 'online'
          });
          // Also fetch some orders for the dashboard view
          const ordersRes = await cashierAPI.getOrders({ limit: 5 });
          if (ordersRes.data.success) setOrders(ordersRes.data.data);
        }
      } else if (activeTab === 'approved' || activeTab === 'monitor') {
        const status = activeTab === 'approved' ? 'pending' : statusFilter === 'all' ? '' : statusFilter;
        const res = await cashierAPI.getOrders({
          page: pagination.current,
          limit: pagination.pageSize,
          status,
          search: searchText,
          startDate: dateRange ? dateRange[0].toISOString() : '',
          endDate: dateRange ? dateRange[1].toISOString() : ''
        });
        if (res.data.success) {
          setOrders(res.data.data);
          setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
        }
      }

    } catch (error) {
      console.error('Fetch error:', error);
      // Only show message for non-aborted/non-duplicate requests
      if (!error.__CANCEL__) {
        message.destroy(); // Remove old messages
        message.error('Connectivity issue: Failed to load latest data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (orderId) => {
    try {
      setVerifyingId(orderId);
      const res = await cashierAPI.verifyPayment(orderId);
      if (res.data.success) {
        message.success('Payment verified successfully');
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  const handleInvoiceClick = (order) => {
    navigate(`/customer/orders/${order._id}/invoice`);
  };



  const getColumns = () => {
    const columns = [
      {
        title: 'Order ID',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: text => <span style={{ fontWeight: 700 }}>{text || 'N/A'}</span>
      },
      {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        render: (c) => {
          if (!c) return 'Guest';
          const first = c.firstName || '';
          const lastInitial = c.lastName ? `${c.lastName.charAt(0)}.` : '';
          return <span>{`${first} ${lastInitial}`}</span>;
        }
      },
      {
        title: 'Payment Method',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        render: (method) => <Tag>{method || 'Chapa'}</Tag>
      },
      {
        title: 'Chapa Ref',
        dataIndex: 'transactionRef',
        key: 'transactionRef',
        width: 150,
        ellipsis: true,
        render: (ref) => <Tooltip title={ref}><Text code>{ref || '---'}</Text></Tooltip>
      },
      {
        title: 'Amount',
        dataIndex: 'finalAmount',
        key: 'finalAmount',
        render: (val) => <Text strong>ETB {val?.toFixed(2)}</Text>
      },
      {
        title: 'Status',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        render: (status) => {
          const color = status === 'paid' ? 'success' : status === 'pending' ? 'warning' : status === 'failed' ? 'error' : 'default';
          const label = status === 'paid' ? 'SUCCESSFUL' : status?.toUpperCase();
          return <Tag color={color}>{label}</Tag>;
        }
      }
    ];

    if (activeTab === 'monitor') {
      columns.splice(4, 0, {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: date => dayjs(date).format('MMM D, HH:mm')
      });
    }

    columns.push({
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Order Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>View Details</Button>
          </Tooltip>
          {activeTab === 'approved' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleVerify(record._id)}
              loading={verifyingId === record._id}
            >
              Verify Payment
            </Button>
          )}
          {activeTab === 'monitor' && record.paymentStatus === 'paid' && (
            <Button size="small" icon={<PrinterOutlined />} onClick={() => handleInvoiceClick(record)}>Receipt</Button>
          )}
        </Space>
      )
    });

    return columns;
  };

  return (
    <div className="cashier-dashboard-container fade-in" style={{ padding: '24px' }}>
      {!currentShift && (
        <Alert
          message="No active shift"
          description="Please start a shift to begin processing payments."
          type="warning"
          showIcon
          action={<Button size="small" type="primary" onClick={() => setShiftModalVisible(true)}>Start Shift</Button>}
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        />
      )}

      {activeTab === 'dashboard' && (
        <div className="dashboard-view fade-in">
          <div className="welcome-section" style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8 }}>Cashier Dashboard 👋</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>Operational Role: Payment Verification & Confirmation</Text>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} md={18}>
              <Card className="stats-banner-mini">
                <Space size={48} split={<div style={{ width: 1, height: 40, background: '#e2e8f0' }} />}>
                  <div className="banner-stat">
                    <Text className="banner-stat-title">TOTAL PAID</Text>
                    <div className="banner-stat-value" style={{ color: '#10b981' }}>{stats.paid}</div>
                  </div>
                  <div className="banner-stat">
                    <Text className="banner-stat-title">PENDING</Text>
                    <div className="banner-stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</div>
                  </div>
                  <div className="banner-stat">
                    <Text className="banner-stat-title">FAILED</Text>
                    <div className="banner-stat-value" style={{ color: '#ef4444' }}>{stats.failed}</div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <div className="section-title">QUICK ACTIONS</div>
          <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
            {[
              { title: 'Verify Payments', icon: <CheckCircleOutlined />, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', action: () => navigate('/cashier/pending') },
              { title: 'Monitor Transactions', icon: <HistoryOutlined />, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', action: () => navigate('/cashier/transactions') },
              { title: 'Payment Alerts', icon: <BellOutlined />, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', action: () => navigate('/cashier/transactions') },
              { title: 'Shift Reports', icon: <AreaChartOutlined />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', action: () => message.info('Generating shift report...') },
            ].map((action, index) => (
              <Col xs={12} md={6} key={index}>
                <Card className="quick-action-card-refined" hoverable onClick={action.action}>
                  <div className="action-icon-refined" style={{ background: action.bgColor, color: action.color }}>{action.icon}</div>
                  <div className="action-info">
                    <Text strong style={{ fontSize: 14 }}>{action.title}</Text>
                    <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                className="premium-card"
                title={<span style={{ fontWeight: 600 }}>Recent Payment Activity</span>}
                extra={<Button type="link" onClick={() => navigate('/cashier/transactions')}>View All</Button>}
              >
                <Table
                  className="dashboard-table"
                  dataSource={orders.slice(0, 5)}
                  columns={getColumns()}
                  pagination={false}
                  loading={loading}
                  rowKey="_id"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                className="premium-card"
                title={<span style={{ fontWeight: 600 }}>Payment Alerts</span>}
              >
                <List
                  dataSource={alerts.filter(a => a.type === 'payment')}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={item.message}
                        avatar={<Badge status={item.severity === 'high' ? 'error' : 'warning'} />}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No urgent payment alerts' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {(activeTab === 'approved' || activeTab === 'monitor') && (
        <Card
          style={{ borderRadius: 16 }}
          title={activeTab === 'approved' ? 'Payment Verification Page' : 'Payment Monitoring Tool'}
        >
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Search
                placeholder="Search Order ID or Chapa Ref..."
                style={{ width: 300 }}
                onSearch={v => { setSearchText(v); setPagination(p => ({ ...p, current: 1 })); }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'paid', label: 'Successful' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' }
                ]}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh Data</Button>
          </div>
          <Table
            dataSource={orders}
            columns={getColumns()}
            loading={loading}
            rowKey="_id"
            pagination={{ ...pagination, onChange: p => setPagination(prev => ({ ...prev, current: p })) }}
          />
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="premium-card" style={{ padding: 0 }} bordered={false}>
          <Row gutter={0}>
            <Col xs={24} md={7}>
              <div className="profile-sidebar-card" style={{ height: '100%' }}>
                <div className="avatar-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                  <Upload
                    name="image"
                    showUploadList={false}
                    customRequest={async ({ file }) => {
                      try {
                        setUploading(true);
                        const formData = new FormData();
                        formData.append('image', file);
                        const res = await uploadAvatar(formData);
                        if (res.success) {
                          message.success('Profile photo updated');
                        } else {
                          message.error(res.message || 'Upload failed');
                        }
                      } catch (err) {
                        message.error('Upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }}
                    beforeUpload={(file) => {
                      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
                      if (!isJpgOrPng) {
                        message.error('You can only upload JPG/PNG/WebP files!');
                      }
                      const isLt2M = file.size / 1024 / 1024 < 2;
                      if (!isLt2M) {
                        message.error('Image must be smaller than 2MB!');
                      }
                      return isJpgOrPng && isLt2M;
                    }}
                  >
                    <div style={{ cursor: 'pointer', position: 'relative' }}>
                      <Avatar
                        size={120}
                        src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}?t=${new Date().getTime()}`) : null}
                        icon={uploading ? <LoadingOutlined /> : <UserOutlined />}
                        style={{ border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <div className="avatar-upload-overlay" style={{
                        position: 'absolute',
                        bottom: 5,
                        right: 5,
                        background: '#3b82f6',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        border: '2px solid #fff'
                      }}>
                        <CameraOutlined style={{ fontSize: 16 }} />
                      </div>
                    </div>
                  </Upload>
                </div>
                <Title level={3} style={{ marginBottom: 4 }}>
                  {user?.firstName} {user?.lastName}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </Text>

                <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
                  <Tag color="blue" style={{ borderRadius: 6, padding: '4px 12px' }}>
                    ID: {user?.id?.substring(0, 8).toUpperCase()}
                  </Tag>
                  <div style={{ marginTop: 24, textAlign: 'left' }}>
                    <Title level={5}>Quick Status</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Badge status="success" text="System Online" />
                      <Badge status="processing" text="Active Session" />
                      <Badge status={currentShift ? "processing" : "default"} text={currentShift ? `Shift ${currentShift.shiftNumber}` : "No Active Shift"} />
                    </Space>
                  </div>
                </Space>

                <Divider />

                <Button
                  icon={<LogoutOutlined />}
                  danger
                  block
                  size="large"
                  style={{ borderRadius: 12 }}
                  onClick={handleLogout}
                >
                  Terminate Session
                </Button>
              </div>
            </Col>

            <Col xs={24} md={17}>
              <div style={{ padding: '32px 40px' }}>
                <Tabs
                  className="settings-tabs"
                  defaultActiveKey="1"
                  items={[
                    {
                      key: '1',
                      label: <span><UserOutlined /> Profile Details</span>,
                      children: (
                        <div className="fade-in">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Title level={4} style={{ margin: 0 }}>Personal Information</Title>
                            <Button
                              type="link"
                              icon={<SettingOutlined />}
                              onClick={() => {
                                profileForm.setFieldsValue({
                                  firstName: user?.firstName,
                                  lastName: user?.lastName,
                                  phone: user?.phone
                                });
                                setEditProfileModalVisible(true);
                              }}
                            >
                              Edit Details
                            </Button>
                          </div>
                          <Descriptions column={2} layout="vertical" className="premium-descriptions">
                            <Descriptions.Item label="FULL NAME">
                              <Text strong style={{ fontSize: 16 }}>{user?.firstName} {user?.lastName}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="EMAIL ADDRESS">
                              {user?.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="PHONE NUMBER">
                              {user?.phone || '+251 911 223 344'}
                            </Descriptions.Item>
                            <Descriptions.Item label="BRANCH LOCATION">
                              {user?.address?.city || 'Addis Ababa'}, {user?.address?.region || 'ET'}
                            </Descriptions.Item>
                          </Descriptions>

                          <Divider />

                          <Title level={4} style={{ marginBottom: 24, marginTop: 8 }}>Professional info</Title>
                          <Descriptions column={2} layout="vertical">
                            <Descriptions.Item label="PHARMACY UNIT">
                              {user?.pharmacyId || 'Unit-01 Central'}
                            </Descriptions.Item>
                            <Descriptions.Item label="ACCESS LEVEL">
                              Cashier Standard
                            </Descriptions.Item>
                            <Descriptions.Item label="JOINED DATE">
                              {user?.createdAt ? dayjs(user.createdAt).format('MMM D, YYYY') : 'Jan 15, 2024'}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: <span><SettingOutlined /> Preferences</span>,
                      children: (
                        <div className="fade-in">
                          <Title level={4} style={{ marginBottom: 24 }}>User Preferences</Title>
                          <Form layout="vertical" className="premium-form">
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Row justify="space-between" align="middle">
                                <Col>
                                  <Text strong>Sound Notifications</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>Play chime for new payment requests</Text>
                                </Col>
                                <Col><Switch checked={soundEnabled} onChange={setSoundEnabled} /></Col>
                              </Row>
                              <Divider style={{ margin: '12px 0' }} />
                              <Row justify="space-between" align="middle">
                                <Col>
                                  <Text strong>Auto-Refresh Data</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>Synchronize stats every 30 seconds</Text>
                                </Col>
                                <Col><Switch checked={autoRefreshEnabled} onChange={setAutoRefreshEnabled} /></Col>
                              </Row>
                            </Space>

                            <Button
                              type="primary"
                              size="large"
                              style={{ marginTop: 32, borderRadius: 10, padding: '0 40px' }}
                              onClick={async () => {
                                const res = await updateProfile({
                                  settings: {
                                    notificationsEnabled: soundEnabled,
                                    autoRefresh: autoRefreshEnabled,
                                    theme: 'light'
                                  }
                                });
                                if (res.success) message.success('Preferences saved successfully');
                                else message.error(res.message);
                              }}
                            >
                              Save Changes
                            </Button>
                          </Form>
                        </div>
                      )
                    },
                    {
                      key: '3',
                      label: <span><ExclamationCircleOutlined /> Security</span>,
                      children: (
                        <div className="fade-in">
                          <Title level={4} style={{ marginBottom: 24 }}>Account Security</Title>
                          <Card style={{ backgroundColor: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f', marginBottom: 24 }}>
                            <Space align="start">
                              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                              <div>
                                <Text strong>Password Last Changed: 3 months ago</Text>
                                <br />
                                <Text type="secondary">We recommend changing your password every 90 days for maximum security.</Text>
                              </div>
                            </Space>
                          </Card>

                          <Form layout="vertical">
                            <Button
                              type="primary"
                              block
                              size="large"
                              style={{ height: 60, borderRadius: 10, background: '#1e293b', borderColor: '#1e293b' }}
                              onClick={() => setPasswordModalVisible(true)}
                            >
                              Change Account Password
                            </Button>

                            <Divider />

                            <Title level={5}>Active Session Management</Title>
                            <Text type="secondary">Login detected from: Chrome / Windows 11 (Current)</Text>
                            <br />
                            <Button type="link" style={{ padding: 0 }} onClick={() => setSessionsModalVisible(true)}>View Session Logs</Button>
                          </Form>
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="premium-card fade-in" title={<Title level={4} style={{ margin: 0 }}><BellOutlined /> System Notifications</Title>}>
          <div className="notifications-container">
            {alerts && alerts.length > 0 ? (
              alerts.map((item, index) => {
                let icon = <InfoCircleOutlined style={{ color: '#1890ff' }} />;
                let title = 'System Notification';

                if (item.type === 'low_stock') {
                  icon = <WarningOutlined style={{ color: '#faad14' }} />;
                  title = 'Low Stock Alert';
                } else if (item.type === 'out_of_stock') {
                  icon = <StopOutlined style={{ color: '#ff4d4f' }} />;
                  title = 'Out of Stock';
                } else if (item.type === 'expiring_soon') {
                  icon = <ClockCircleOutlined style={{ color: '#faad14' }} />;
                  title = 'Expiry Warning';
                } else if (item.type === 'pending_refunds') {
                  // Using WalletOutlined for refunds, ensuring it's imported or fallback to SyncOutlined
                  icon = <WalletOutlined style={{ color: '#1890ff' }} />;
                  title = 'Refund Request';
                }

                return (
                  <div key={index} style={{ display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ marginRight: 16 }}>
                      <Avatar icon={icon} style={{ backgroundColor: '#f0f2f5' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>Just now</Text>
                      </div>
                      <Text type="secondary">{item.message}</Text>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <Text type="secondary">No new notifications</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      <ShiftManagement visible={shiftModalVisible} onClose={() => setShiftModalVisible(false)} currentShift={currentShift} onShiftUpdate={fetchData} />

      <Modal
        title={`Order Payment Details: ${selectedOrder?.orderNumber}`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>Close</Button>,
          selectedOrder?.paymentStatus === 'paid' && <Button key="receipt" type="primary" icon={<PrinterOutlined />} onClick={() => handleInvoiceClick(selectedOrder)}>Generate Receipt</Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div className="read-only-details">
            <Alert
              message="Read-Only View"
              description="Cashiers cannot modify orders. This view is for verification only."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Order Number">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer Name">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</Descriptions.Item>
              <Descriptions.Item label="Total Amount"><Text strong>ETB {selectedOrder.finalAmount?.toFixed(2)}</Text></Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedOrder.paymentStatus === 'paid' ? 'success' : selectedOrder.paymentStatus === 'pending' ? 'warning' : 'error'}>
                  {selectedOrder.paymentStatus?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chapa Reference ID"><Text code>{selectedOrder.transactionRef || 'N/A'}</Text></Descriptions.Item>
              <Descriptions.Item label="Payment Method">{selectedOrder.paymentMethod || 'Chapa'}</Descriptions.Item>
              <Descriptions.Item label="Payment Timestamp">{selectedOrder.paidAt ? dayjs(selectedOrder.paidAt).format('LLL') : '---'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>
            <List
              size="small"
              dataSource={selectedOrder.items}
              renderItem={item => (
                <List.Item>
                  <Space justify="space-between" style={{ width: '100%' }}>
                    <span>{item.name} x {item.quantity}</span>
                    <Text type="secondary">ETB {(item.price * item.quantity).toFixed(2)}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Account Password"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        onOk={() => passwordForm.submit()}
        okText="Update Password"
        confirmLoading={loading}
      >
        <Alert
          message="Security Notice"
          description="Changing your password will require you to log in again on all other devices."
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={async (values) => {
            if (values.newPassword !== values.confirmPassword) {
              return message.error('Passwords do not match');
            }
            const res = await updateProfile({ password: values.newPassword });
            if (res.success) {
              message.success(res.message || 'Password updated successfully');
              setPasswordModalVisible(false);
              passwordForm.resetFields();
            } else {
              message.error(res.message || 'Update failed');
            }
          }}
        >
          <Form.Item
            name="newPassword"
            label={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>New Password</span>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, fontSize: 12 }}
                  onClick={() => {
                    const generated = Math.random().toString(36).slice(-10) + 'A1!';
                    passwordForm.setFieldsValue({ newPassword: generated, confirmPassword: generated });
                    message.info('Secure password generated');
                  }}
                >
                  Generate Strong Password
                </Button>
              </Space>
            }
            rules={[{ required: true, message: 'Please enter a new password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            rules={[{ required: true, message: 'Please confirm your new password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Session Logs Modal */}
      <Modal
        title="Active Account Sessions"
        open={sessionsModalVisible}
        onCancel={() => setSessionsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSessionsModalVisible(false)}>Done</Button>
        ]}
        width={500}
      >
        <List
          itemLayout="horizontal"
          dataSource={[
            { device: 'Chrome / Windows 11', location: 'Addis Ababa, ET', status: 'Current', icon: <LockOutlined style={{ color: '#52c41a' }} /> },
            { device: 'Safari / iPhone 13', location: 'Addis Ababa, ET', status: '2 hours ago', icon: <LockOutlined style={{ color: '#faad14' }} /> },
            { device: 'Firefox / Mac OS', location: 'Unknown', status: 'Yesterday', icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> }
          ]}
          renderItem={item => (
            <List.Item actions={[<Button type="link" danger size="small" onClick={() => message.success('Session revoked successfully')}>Revoke</Button>]}>
              <List.Item.Meta
                avatar={<Avatar icon={item.icon} style={{ backgroundColor: '#f0f2f5' }} />}
                title={item.device}
                description={`${item.location} • ${item.status}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Personal Information"
        open={editProfileModalVisible}
        onCancel={() => setEditProfileModalVisible(false)}
        onOk={() => profileForm.submit()}
        okText="Update Profile"
        confirmLoading={loading}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={async (values) => {
            const res = await updateProfile(values);
            if (res.success) {
              message.success('Profile updated successfully');
              setEditProfileModalVisible(false);
            } else {
              message.error(res.message);
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="phone" label="Phone Number">
            <Input prefix={<BellOutlined />} placeholder="+251 ..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CashierDashboard;
