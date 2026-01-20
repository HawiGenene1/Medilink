import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Button, Tabs, message, Space, Tooltip, Modal, Form, Input, DatePicker, Descriptions, Divider, Badge, Select, List, Avatar, Progress } from 'antd';
import {
  DollarCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SearchOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  RightOutlined
} from '@ant-design/icons';
import { cashierAPI } from '../../../services/api/cashier';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './CashierDashboard.css';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    total_revenue: 0,
    todays_revenue: 0,
    todays_refunds: 0,
    systemStatus: 'online',
    recentActivity: []
  });
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // For transaction history filtering

  // Report Filters
  const [reportPeriod, setReportPeriod] = useState('monthly'); // daily, weekly, monthly, custom
  const [reportRange, setReportRange] = useState([moment().startOf('month'), moment().endOf('month')]);

  // Action States
  const [verifyingId, setVerifyingId] = useState(null);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportingMap, setExportingMap] = useState({});

  // Forms
  const [refundForm] = Form.useForm();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Quick Actions for Cashier
  const quickActions = [
    {
      title: 'Verify Payment',
      icon: <CheckCircleOutlined />,
      color: '#43A047',
      bgColor: 'rgba(67, 160, 71, 0.1)',
      action: () => setActiveTab('approved')
    },
    {
      title: 'View Transactions',
      icon: <FileTextOutlined />,
      color: '#1E88E5',
      bgColor: 'rgba(30, 136, 229, 0.1)',
      action: () => setActiveTab('transactions')
    },
    {
      title: 'Financial Reports',
      icon: <DollarCircleOutlined />,
      color: '#FFB300',
      bgColor: 'rgba(255, 179, 0, 0.1)',
      action: () => setActiveTab('reports')
    },
    {
      title: 'Settings',
      icon: <SettingOutlined />,
      color: '#E53935',
      bgColor: 'rgba(229, 57, 53, 0.1)',
      action: () => navigate('/cashier/settings')
    }
  ];

  useEffect(() => {
    fetchData();
    // Only auto-refresh dashboard overview stats
    if (activeTab === 'dashboard') {
      const interval = setInterval(() => {
        fetchStatsOnly();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, pagination.current, searchText, dateRange, reportRange]);

  // Handle Report Period Change
  const handleReportPeriodChange = (value) => {
    setReportPeriod(value);
    const end = moment();
    let start = moment();

    if (value === 'daily') start = moment().startOf('day');
    if (value === 'weekly') start = moment().startOf('week');
    if (value === 'monthly') start = moment().startOf('month');

    if (value !== 'custom') {
      setReportRange([start, end]);
    }
  };

  const fetchStatsOnly = async () => {
    try {
      const statsRes = await cashierAPI.getStats();
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (error) { console.error('Auto-refresh stats error', error); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Always fetch stats for the overview cards
      const statsRes = await cashierAPI.getStats();
      if (statsRes.data.success) setStats(statsRes.data.data);

      if (activeTab !== 'dashboard' && activeTab !== 'reports') {
        let statusFilter = activeTab === 'approved' ? 'pending' : 'paid';

        // Apply additional filters for transaction history
        if (activeTab === 'transactions' && statusFilter !== 'all') {
          statusFilter = statusFilter;
        }

        const params = {
          status: statusFilter,
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
          endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined
        };

        const ordersRes = await cashierAPI.getOrders(params);
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data);
          setPagination({
            ...pagination,
            total: ordersRes.data.pagination.total
          });
        }
      }

      if (activeTab === 'reports') {
        const params = {
          startDate: reportRange ? reportRange[0].format('YYYY-MM-DD') : undefined,
          endDate: reportRange ? reportRange[1].format('YYYY-MM-DD') : undefined
        };
        const reportRes = await cashierAPI.getFinancialReport(params);
        if (reportRes.data.success) setReportData(reportRes.data.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleVerify = async (orderId) => {
    try {
      setVerifyingId(orderId);
      const response = await cashierAPI.verifyPayment(orderId);
      if (response.data.success) {
        if (response.data.data.status === 'paid' || response.data.data.status === 'success') {
          message.success('Payment Verified: SUCCESS');
          fetchData();
        } else {
          message.warning(`Payment Pending/Failed: ${response.data.data.status}`);
        }
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRefundClick = (order) => {
    setSelectedOrder(order);
    setRefundModalVisible(true);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  const handleProcessRefund = async (values) => {
    try {
      await cashierAPI.initiateRefund(selectedOrder._id, {
        amount: selectedOrder.finalAmount,
        reason: values.reason
      });

      message.success('Refund processed successfully');
      setRefundModalVisible(false);
      refundForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('Refund failed: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleInvoiceClick = async (order) => {
    try {
      message.loading({ content: 'Generating Official Invoice...', key: 'invoiceGen' });
      const response = await cashierAPI.generateInvoice(order._id);

      if (response.data.success && response.data.data.pdfUrl) {
        message.success({ content: 'Invoice Generated!', key: 'invoiceGen' });
        const backendUrl = 'http://localhost:5000';
        window.open(`${backendUrl}${response.data.data.pdfUrl}`, '_blank');
      } else {
        message.error({ content: 'Failed to generate invoice PDF', key: 'invoiceGen' });
      }
    } catch (error) {
      console.error('Invoice error:', error);
      message.error({ content: 'Error generating invoice', key: 'invoiceGen' });
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // EXPORTS
  const handleExportPDF = async () => {
    try {
      message.loading({ content: 'Generating PDF Report...', key: 'exportPdf' });
      const response = await cashierAPI.exportReportPDF({
        startDate: reportRange ? reportRange[0].format('YYYY-MM-DD') : undefined,
        endDate: reportRange ? reportRange[1].format('YYYY-MM-DD') : undefined
      });

      if (response.data.success && response.data.data.pdfUrl) {
        message.success({ content: 'Report Generated!', key: 'exportPdf' });
        const backendUrl = 'http://localhost:5000';
        window.open(`${backendUrl}${response.data.data.pdfUrl}`, '_blank');
      } else {
        message.error({ content: 'Failed to generate PDF', key: 'exportPdf' });
      }
    } catch (error) {
      message.error({ content: 'Export failed', key: 'exportPdf' });
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    message.loading({ content: 'Preparing CSV...', key: 'exportCsv' });

    const rows = [
      ['Metric', 'Value'],
      ['Gross Revenue', reportData.totalRevenue],
      ['Total Refunds', reportData.totalRefunds],
      ['Net Income', reportData.netIncome],
      ['Successful Txns', reportData.successCount],
      ['Failed Txns', reportData.failedCount],
      ['Avg Order Value', reportData.avgOrderValue],
      [],
      ['Payment Method', 'Count'],
      ...Object.entries(reportData.methodBreakdown || {}),
      [],
      ['Generated At', new Date().toLocaleString()]
    ];

    const csvContent = "data:text/csv;charset=utf-8,"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Report_${moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success({ content: 'CSV Downloaded', key: 'exportCsv' });
  };

  // --- COLUMNS ---

  const getColumns = () => {
    const columns = [
      {
        title: 'Order Ref',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: text => <span style={{ fontWeight: 700, color: '#2c3e50' }}>{text || 'N/A'}</span>
      },
      {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        render: (c) => <span style={{ fontWeight: 500 }}>{c ? `${c.firstName} ${c.lastName}` : 'Guest'}</span>
      },
      {
        title: 'Amount',
        dataIndex: 'finalAmount',
        key: 'finalAmount',
        render: (val) => <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>ETB {val?.toFixed(2)}</span>
      }
    ];

    if (activeTab === 'transactions') {
      columns.push(
        {
          title: 'Tx Ref',
          dataIndex: 'transactionRef',
          key: 'transactionRef',
          render: t => <Text code>{t || 'N/A'}</Text>
        },
        {
          title: 'Payment Method',
          dataIndex: 'paymentMethod',
          key: 'paymentMethod',
          render: text => <Tag color="blue">{text || 'N/A'}</Tag>
        },
        {
          title: 'Date',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: date => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
        }
      );
    }

    columns.push({
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const color = status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'default';
        return <Tag color={color} className={`ant-tag-${color}`}>{status?.toUpperCase()}</Tag>;
      }
    });

    columns.push({
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          {activeTab === 'approved' && (
            <Button
              className="btn-action"
              type="primary"
              icon={<SyncOutlined spin={verifyingId === record._id} />}
              onClick={() => handleVerify(record._id)}
              loading={verifyingId === record._id}
            >
              Verify
            </Button>
          )}
          {activeTab === 'transactions' && (
            <>
              <Button className="btn-action" icon={<PrinterOutlined />} onClick={() => handleInvoiceClick(record)}>Invoice</Button>
              <Button className="btn-action" danger icon={<ReloadOutlined />} onClick={() => handleRefundClick(record)}>Refund</Button>
            </>
          )}
        </Space>
      )
    });

    return columns;
  };

  // --- RENDER HELPERS ---
  const StatCard = ({ title, value, icon, colorClass, prefix, secondaryText }) => (
    <div className="stat-card p-4">
      <div style={{ padding: '24px' }}>
        <div className={`stat-icon-wrapper ${colorClass}`}>
          {icon}
        </div>
        <div className="stat-value">
          {prefix && <span style={{ fontSize: '18px', marginRight: '4px' }}>{prefix}</span>}
          {value}
        </div>
        <div className="stat-label">{title}</div>
        {secondaryText && <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>{secondaryText}</div>}
      </div>
    </div>
  );

  const items = [
    { label: 'Dashboard Overview', key: 'dashboard' },
    { label: 'Approved Orders', key: 'approved' },
    { label: 'Transaction History', key: 'transactions' },
    { label: 'Financial Reports', key: 'reports' }
  ];

  return (
    <div className="customer-dashboard-full">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">ML</div>
            <span className="logo-text">MediLink</span>
          </div>
          <div className="sidebar-menu">
            <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <AppstoreOutlined style={{ fontSize: '16px' }} />
              <span>Dashboard Overview</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
              <FileTextOutlined style={{ fontSize: '16px' }} />
              <span>Approved Orders</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
              <SyncOutlined style={{ fontSize: '16px' }} />
              <span>Transaction History</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <DollarCircleOutlined style={{ fontSize: '16px' }} />
              <span>Financial Reports</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Cashier Dashboard</h1>
            <div className="header-actions">
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
        <div className="default-dashboard fade-in">
          <div className="welcome-section" style={{ marginBottom: '32px' }}>
            <Title level={2} style={{ marginBottom: '8px' }}>Welcome back! 👋</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>Manage payments and view financial reports</Text>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} md={6}>
              <Card className="stats-banner-mini" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <Space size="large">
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Pending</Text>
                    <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>{stats.pending}</Title>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Completed</Text>
                    <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>{stats.paid}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card className="stats-banner-mini" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <Space size="large">
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Failed</Text>
                    <Title level={2} style={{ margin: 0, color: '#cf1322' }}>{stats.failed}</Title>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Refunded</Text>
                    <Title level={2} style={{ margin: 0, color: '#faad14' }}>{stats.refunded || 0}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="stats-banner-mini" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <Space size="large">
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Today's Revenue</Text>
                    <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>ETB {stats.todays_revenue?.toFixed(2)}</Title>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                  <div className="banner-stat">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Today's Refunds</Text>
                    <Title level={2} style={{ margin: 0, color: '#faad14' }}>ETB {stats.todays_refunds?.toFixed(2)}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* System Status */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col span={24}>
              <Card title="System Status" className="main-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                      <Space direction="vertical">
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3f8600', marginBottom: '8px' }}></div>
                        <Text strong>System {stats.systemStatus === 'online' ? 'Online' : 'Offline'}</Text>
                        <Text type="secondary">All services operational</Text>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#e6f7ff', borderRadius: '8px' }}>
                      <Space direction="vertical">
                        <DollarCircleOutlined style={{ fontSize: '24px', color: '#1e88e5', marginBottom: '8px' }} />
                        <Text strong>Payment Processing</Text>
                        <Text type="secondary">Gateway active</Text>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#fff7e6', borderRadius: '8px' }}>
                      <Space direction="vertical">
                        <SyncOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
                        <Text strong>Auto-Refresh</Text>
                        <Text type="secondary">Every 30 seconds</Text>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                      <Space direction="vertical">
                        <CheckCircleOutlined style={{ fontSize: '24px', color: '#3f8600', marginBottom: '8px' }} />
                        <Text strong>Data Restricted</Text>
                        <Text type="secondary">Payment data only</Text>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Recent Payment Activity */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col span={24}>
              <Card title="Recent Payment Activity" className="main-card">
                <List
                  dataSource={orders.slice(0, 5)}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<DollarCircleOutlined />} style={{ background: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }} />}
                        title={<Text strong>{item.orderNumber}</Text>}
                        description={
                          <Space direction="vertical" size="small">
                            <Text>{item.customer?.firstName} {item.customer?.lastName}</Text>
                            <Text type="secondary">{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <Space>
                              <Text strong>ETB {item.finalAmount?.toFixed(2)}</Text>
                              <Tag color={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'pending' ? 'warning' : 'default'}>
                                {item.paymentStatus?.toUpperCase()}
                              </Tag>
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <div className="section-title" style={{ marginBottom: '20px', fontWeight: 600, fontSize: '18px' }}>Quick Actions</div>
          <Row gutter={[16, 16]} style={{ marginBottom: '40px' }}>
            {quickActions.map((action, index) => (
              <Col xs={12} md={6} key={index}>
                <Card className="quick-action-card-refined" hoverable onClick={action.action}>
                  <div className="action-icon-refined" style={{ background: action.bgColor, color: action.color, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{action.icon}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{action.title}</Text>
                    <RightOutlined style={{ fontSize: '12px', color: '#94A3B8' }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Card title={<Title level={4} style={{ margin: 0 }}>Recent Orders</Title>} extra={<Button type="link" onClick={() => setActiveTab('approved')}>View All</Button>}>
                <List itemLayout="horizontal" dataSource={orders.slice(0, 3)} renderItem={item => (
                  <List.Item actions={[
                    <Button type="primary" size="small" key="verify" onClick={() => handleVerify(item._id)} loading={verifyingId === item._id}>Verify</Button>
                  ]}>
                    <List.Item.Meta
                      avatar={<Avatar shape="square" size={48} icon={<FileTextOutlined />} style={{ background: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }} />}
                      title={<Text strong>{item.orderNumber}</Text>}
                      description={
                        <div>
                          <Space size="small">
                            <Text type="secondary">{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <Text strong>ETB {item.finalAmount?.toFixed(2)}</Text>
                          </Space>
                          <Tag color={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'pending' ? 'warning' : 'default'} style={{ marginTop: '8px' }}>{item.paymentStatus?.toUpperCase()}</Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={<Title level={4} style={{ margin: 0 }}>System Status</Title>} extra={<Button type="link" onClick={handleLogout} danger icon={<LogoutOutlined />}>Logout</Button>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <Space>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3f8600' }}></div>
                      <Text strong>System Online</Text>
                    </Space>
                  </div>
                  <div style={{ padding: '16px', background: '#fff7e6', borderRadius: '8px' }}>
                    <Space>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#faad14' }}></div>
                      <Text>Payments Active</Text>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* LIST VIEWS */}
      {(activeTab === 'approved' || activeTab === 'transactions') && (
        <Card className="main-card">
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              {activeTab === 'approved' ? 'Orders Awaiting Payment' : 'Transaction History'}
            </Title>

            <Space>
              {activeTab === 'transactions' && (
                <>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 120, marginRight: 8 }}
                    placeholder="Status"
                  >
                    <Option value="all">All</Option>
                    <Option value="paid">Successful</Option>
                    <Option value="failed">Failed</Option>
                    <Option value="refunded">Refunded</Option>
                  </Select>
                  <Search
                    placeholder="Search Order Ref"
                    allowClear
                    onSearch={val => setSearchText(val)}
                    style={{ width: 200 }}
                  />
                  <RangePicker onChange={setDateRange} />
                </>
              )}
              <Button className="btn-primary-gradient" icon={<SyncOutlined />} onClick={fetchData}>
                Refresh
              </Button>
            </Space>
          </div>

          <Table
            dataSource={orders}
            columns={getColumns()}
            rowKey="_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </Card>
      )}

      {/* REPORTS TAB */}
      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <Card className="main-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>Financial Report</Title>
            <Space>
              <Select value={reportPeriod} onChange={handleReportPeriodChange} style={{ width: 120 }}>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
                <Option value="custom">Custom</Option>
              </Select>
              {reportPeriod === 'custom' && (
                <RangePicker value={reportRange} onChange={setReportRange} allowClear={false} />
              )}
              <Button icon={<SyncOutlined />} onClick={fetchData}>Update</Button>
            </Space>
          </div>

          {reportData ? (
            <>
              <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }} size="middle">
                <Descriptions.Item label="Gross Revenue">
                  <span className="stat-value" style={{ color: '#2c3e50' }}>ETB {reportData.totalRevenue?.toFixed(2)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Total Refunds">
                  <span className="stat-value" style={{ color: '#cf1322' }}>ETB {reportData.totalRefunds?.toFixed(2)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Net Income">
                  <span className="stat-value" style={{ color: '#3f8600' }}>ETB {reportData.netIncome?.toFixed(2)}</span>
                </Descriptions.Item>

                <Descriptions.Item label="Successful Txns">
                  <Tag color="success" style={{ fontSize: 16, padding: '4px 12px' }}>{reportData.successCount}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Failed Txns">
                  <Tag color="error" style={{ fontSize: 16, padding: '4px 12px' }}>{reportData.failedCount}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Avg Order Value">
                  ETB {reportData.avgOrderValue?.toFixed(2)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Payment Methods</Divider>
              <Row gutter={16}>
                {Object.entries(reportData.methodBreakdown || {}).map(([method, count]) => (
                  <Col key={method} span={6}>
                    <Card size="small" style={{ textAlign: 'center', background: '#f8f9fa' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{method}</div>
                      <div style={{ fontSize: 20, color: '#1890ff' }}>{count}</div>
                    </Card>
                  </Col>
                ))}
                {Object.keys(reportData.methodBreakdown || {}).length === 0 && <Text type="secondary">No payment data available for this period.</Text>}
              </Row>

              <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
                <Button className="btn-primary-gradient" size="large" icon={<FileTextOutlined />} onClick={handleExportPDF}>Export PDF Report</Button>
                <Button size="large" icon={<FileTextOutlined />} onClick={handleExportExcel}>Export CSV</Button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Paragraph>No report data available. Please select a period and click Update.</Paragraph>
            </div>
          )}
        </Card>
      )}

      {/* REFUND MODAL */}
      <Modal
        title="Process Refund"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={refundForm} onFinish={handleProcessRefund} layout="vertical">
          <Form.Item name="reason" label="Refund Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Enter reason for refund..." />
          </Form.Item>
          <Button type="primary" danger htmlType="submit" block size="large">
            Confirm Refund
          </Button>
        </Form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailsModalVisible(false)}>Close</Button>]}
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Customer">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedOrder.customer?.email}</Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(selectedOrder.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color="blue">{selectedOrder.paymentStatus?.toUpperCase()}</Tag></Descriptions.Item>
              {selectedOrder.transactionRef && <Descriptions.Item label="Tx Ref">{selectedOrder.transactionRef}</Descriptions.Item>}
            </Descriptions>
            <Divider orientation="left">Items</Divider>
            <Table
              dataSource={selectedOrder.items}
              pagination={false}
              size="small"
              rowKey="_id"
              columns={[
                { title: 'Item', dataIndex: 'name' }, // Assuming name exists
                { title: 'Qty', dataIndex: 'quantity' },
                { title: 'Price', dataIndex: 'price', render: v => v?.toFixed(2) },
                { title: 'Total', render: (_, r) => (r.quantity * r.price).toFixed(2) }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={3} align="right"><b>Total</b></Table.Summary.Cell>
                  <Table.Summary.Cell><b>ETB {selectedOrder.finalAmount?.toFixed(2)}</b></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
