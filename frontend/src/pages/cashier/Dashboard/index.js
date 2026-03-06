import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Button, Tabs, message, Space, Tooltip, Modal, Form, Input, DatePicker, Descriptions, Divider, Badge, Select, List, Avatar, Progress, Alert, Image } from 'antd';
import {
  DollarCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PrinterOutlined,
  FileTextOutlined,
  SearchOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  RightOutlined,
  MenuOutlined,
  BellOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cashierAPI } from '../../../services/api/cashier';
import cashierPOSService from '../../../services/cashierPOS';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './CashierDashboard.css';
import dayjs from 'dayjs';
import ShiftManagement from './ShiftManagement';
// Removed RefundModal import

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

const CashierDashboard = ({ view }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (view) {
      setActiveTab(view);
    }
  }, [view]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    failed: 0,
    total_revenue: 0,
    todays_revenue: 0,
    systemStatus: 'online',
    recentActivity: []
  });
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(view || 'dashboard');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });

  // Chart Data
  const [chartData, setChartData] = useState([
    { name: '08:00', sales: 400 },
    { name: '10:00', sales: 800 },
    { name: '12:00', sales: 1200 },
    { name: '14:00', sales: 900 },
    { name: '16:00', sales: 1500 },
    { name: '18:00', sales: 1100 },
    { name: '20:00', sales: 600 }
  ]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // For transaction history filtering

  // Report Filters
  const [reportPeriod, setReportPeriod] = useState('monthly'); // daily, weekly, monthly, custom
  const [reportRange, setReportRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);

  // Action States
  const [verifyingId, setVerifyingId] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportingMap, setExportingMap] = useState({});

  // Report Filters

  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [alerts, setAlerts] = useState([]);

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
  }, [activeTab, pagination.current, searchText, dateRange, reportRange, statusFilter]);

  // Handle Report Period Change
  const handleReportPeriodChange = (value) => {
    setReportPeriod(value);
    const end = dayjs();
    let start = dayjs();

    if (value === 'daily') start = dayjs().startOf('day');
    if (value === 'weekly') start = dayjs().startOf('week');
    if (value === 'monthly') start = dayjs().startOf('month');

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
      console.log('[DEBUG] fetchData started. activeTab:', activeTab);
      setLoading(true);

      // Fetch current shift
      try {
        const shiftRes = await cashierPOSService.getCurrentShift();
        if (shiftRes.data.success && shiftRes.data.data) {
          setCurrentShift(shiftRes.data.data);
        }
      } catch (err) {
        console.error('Shift fetch error:', err);
      }

      // Fetch alerts
      try {
        const alertsRes = await cashierPOSService.getAlerts();
        if (alertsRes.data.success) {
          setAlerts(alertsRes.data.data || []);
        }
      } catch (err) {
        console.error('Alerts fetch error:', err);
      }

      // Fetch dashboard stats (use new API for dashboard tab)
      if (activeTab === 'dashboard') {
        try {
          const todayStatsRes = await cashierPOSService.getTodayStats();
          if (todayStatsRes.data.success) {
            const data = todayStatsRes.data.data;
            setStats({
              pending: data.pendingPayments || 0,
              paid: data.transactionCount || 0,
              todays_revenue: data.totalSales || 0,
              paymentMethodBreakdown: data.paymentMethodBreakdown || {}
            });
          }
        } catch (err) {
          console.error('Stats fetch error:', err);
          // Fallback to old API
          const statsRes = await cashierAPI.getStats();
          if (statsRes.data.success) setStats(statsRes.data.data);
        }

        // Fetch recent transactions
        try {
          const recentRes = await cashierPOSService.getRecentTransactions(10);
          console.log('[DEBUG] getRecentTransactions response:', recentRes.data);
          if (recentRes.data.success) {
            console.log('[DEBUG] Setting dashboard orders count:', recentRes.data.data?.length);
            setOrders(recentRes.data.data || []);
          }
        } catch (err) {
          console.error('Recent transactions error:', err);
        }
      }

      // Original data fetching for other tabs
      if (activeTab !== 'dashboard' && activeTab !== 'reports') {
        const effectiveStatus = activeTab === 'approved' ? 'pending' : statusFilter;

        const params = {
          status: effectiveStatus,
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
          endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined
        };

        const ordersRes = await cashierAPI.getOrders(params);
        console.log('[DEBUG] getOrders response:', ordersRes.data);
        if (ordersRes.data.success) {
          console.log('[DEBUG] Setting orders count:', ordersRes.data.data.length);
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

      // Removed activeTab === 'refunds' logic

      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
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
    link.setAttribute("download", `Financial_Report_${dayjs().format('YYYY-MM-DD')}.csv`);
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
        render: text => <Text strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{text || 'N/A'}</Text>
      },
      {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        render: (c) => <Text style={{ color: 'var(--text-main)', fontWeight: 500 }}>{c ? `${c.firstName} ${c.lastName}` : 'Guest'}</Text>
      },
      {
        title: 'Amount',
        dataIndex: 'finalAmount',
        key: 'finalAmount',
        render: (val) => <Text strong style={{ color: 'var(--text-main)' }}>ETB {val?.toFixed(2)}</Text>
      }
    ];

    if (activeTab === 'transactions') {
      columns.push(
        {
          title: 'Tx Ref',
          dataIndex: 'transactionRef',
          key: 'transactionRef',
          render: t => <Text code style={{ fontSize: '12px' }}>{t || 'N/A'}</Text>
        },
        {
          title: 'Payment Method',
          dataIndex: 'paymentMethod',
          key: 'paymentMethod',
          render: text => <Tag color="blue" style={{ borderRadius: '6px' }}>{text || 'N/A'}</Tag>
        },
        {
          title: 'Date',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: date => <Text type="secondary" style={{ fontSize: '13px' }}>{new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        }
      );
    }

    columns.push({
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const color = status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'default';
        return <Tag color={color} style={{ borderRadius: '6px', fontWeight: 600 }}>{status?.toUpperCase()}</Tag>;
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
    <div className="cashier-dashboard-content fade-in" style={{ padding: '24px' }}>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="default-dashboard fade-in-premium">
          <Row gutter={[24, 24]} align="middle" style={{ marginBottom: '32px' }}>
            <Col xs={24} md={16}>
              <Title level={2} style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Welcome back, {user?.firstName || 'Cashier'}! 👋</Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>Here's what's happening in your terminal today.</Text>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space>
                <Tag color="processing" icon={<SyncOutlined spin />} style={{ padding: '4px 12px', borderRadius: '8px' }}>
                  Live Refresh
                </Tag>
                <Tooltip title="Real-time system monitoring active">
                  <InfoCircleOutlined style={{ color: 'var(--text-muted)', fontSize: '18px' }} />
                </Tooltip>
              </Space>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-refined">
                <div className="stat-icon-refined" style={{ background: 'rgba(67, 97, 238, 0.1)', color: '#4361ee' }}>
                  <ShoppingCartOutlined />
                </div>
                <div className="stat-value-refined">{stats.pending}</div>
                <div className="stat-label-refined">Pending Payments</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-refined">
                <div className="stat-icon-refined" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <CheckCircleOutlined />
                </div>
                <div className="stat-value-refined">{stats.paid}</div>
                <div className="stat-label-refined">Completed Today</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={12}>
              <div className="stat-card-refined" style={{ background: 'var(--primary-gradient)' }}>
                <div className="stat-icon-refined" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
                  <DollarOutlined />
                </div>
                <div className="stat-value-refined" style={{ color: '#ffffff' }}>ETB {stats.todays_revenue?.toLocaleString()}</div>
                <div className="stat-label-refined" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Today's Total Revenue</div>
                <div style={{ position: 'absolute', right: '24px', bottom: '24px', opacity: 0.1 }}>
                  <BarChartOutlined style={{ fontSize: '80px', color: '#ffffff' }} />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={16}>
              <Card title="Sales Performance (Today)" className="dashboard-main-card-premium">
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--card-hover-shadow)' }}
                        itemStyle={{ color: '#4361ee', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#4361ee" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Quick Actions" className="dashboard-main-card-premium">
                <Row gutter={[16, 16]}>
                  {quickActions.map((action, index) => (
                    <Col span={12} key={index}>
                      <div className="quick-action-card-premium" onClick={action.action}>
                        <div className="action-icon-premium" style={{ background: action.bgColor, color: action.color }}>
                          {action.icon}
                        </div>
                        <Text strong style={{ fontSize: '12px' }}>{action.title}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Divider />
                <div style={{ textAlign: 'center' }}>
                  <Button type="link" icon={<ClockCircleOutlined />} onClick={() => setShiftModalVisible(true)}>
                    Manage Work Shift
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Recent Transactions" extra={<Button type="link" onClick={() => setActiveTab('transactions')}>View All History</Button>} className="dashboard-main-card-premium">
                <List
                  dataSource={orders.slice(0, 5)}
                  renderItem={item => (
                    <div className="activity-list-item-premium">
                      <Row align="middle" gutter={16}>
                        <Col>
                          <Avatar size={44} icon={<ShoppingCartOutlined />} style={{ background: 'rgba(67, 97, 238, 0.1)', color: '#4361ee', borderRadius: '10px' }} />
                        </Col>
                        <Col flex="auto">
                          <div>
                            <Text strong style={{ color: 'var(--text-main)' }}>{item.orderNumber}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{item.customer?.firstName} {item.customer?.lastName} • {new Date(item.createdAt).toLocaleTimeString()}</Text>
                          </div>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                          <Text strong style={{ color: 'var(--text-main)', display: 'block' }}>ETB {item.finalAmount?.toFixed(2)}</Text>
                          <Tag color={item.paymentStatus === 'paid' ? 'success' : 'warning'} style={{ borderRadius: '6px', margin: 0 }}>
                            {item.paymentStatus?.toUpperCase()}
                          </Tag>
                        </Col>
                        <Col>
                          <Button icon={<EyeOutlined />} type="text" onClick={() => handleViewDetails(item)} />
                        </Col>
                      </Row>
                    </div>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Operating Status" className="dashboard-main-card-premium">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Badge status="processing" color="#10b981" />
                      <Text strong>Payment Gateway</Text>
                    </Space>
                    <Tag color="success">OPERATIONAL</Tag>
                  </div>
                  <Progress percent={100} size="small" strokeColor="#10b981" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Badge status="processing" color="#4361ee" />
                      <Text strong>Database Health</Text>
                    </Space>
                    <Tag color="processing">STABLE</Tag>
                  </div>
                  <Progress percent={98} size="small" strokeColor="#4361ee" />

                  <Alert
                    message="Daily Summary"
                    description="You've processed 12% more payments today than yesterday. Keep it up!"
                    type="info"
                    showIcon
                    style={{ borderRadius: '12px' }}
                  />

                  <Button danger block icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: '10px', marginTop: '8px' }}>
                    Secure Sign Out
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* LIST VIEWS */}
      {(activeTab === 'approved' || activeTab === 'transactions') && (
        <Card className="dashboard-main-card-premium fade-in-premium">
          <div className="section-header-premium">
            <div>
              <Title level={4} className="section-title-premium">
                {activeTab === 'approved' ? 'Payments Awaiting Verification' : 'Global Transaction History'}
              </Title>
              <Text type="secondary">
                {activeTab === 'approved'
                  ? 'Monitor and confirm incoming payment requests from customers.'
                  : 'Complete history of all payment activities processed through this terminal.'}
              </Text>
            </div>

            <Space size="middle">
              {activeTab === 'transactions' && (
                <>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 140 }}
                    placeholder="All Statuses"
                  >
                    <Option value="all">All Transactions</Option>
                    <Option value="paid">Successful Only</Option>
                    <Option value="failed">Failed Only</Option>
                  </Select>
                  <Search
                    placeholder="Search by Order #"
                    allowClear
                    onSearch={val => setSearchText(val)}
                    style={{ width: 220 }}
                  />
                  <RangePicker onChange={setDateRange} />
                </>
              )}
              <Button type="primary" icon={<SyncOutlined />} onClick={fetchData}>
                Refresh Data
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
      {activeTab === 'reports' && (
        <Card className="dashboard-main-card-premium fade-in-premium">
          <div className="section-header-premium">
            <div>
              <Title level={4} className="section-title-premium">Financial Performance Report</Title>
              <Text type="secondary">Detailed breakdown of revenue and transactions for the selected period.</Text>
            </div>
            <Space size="middle">
              <Select value={reportPeriod} onChange={handleReportPeriodChange} style={{ width: 140 }}>
                <Option value="daily">Daily View</Option>
                <Option value="weekly">Weekly View</Option>
                <Option value="monthly">Monthly View</Option>
                <Option value="custom">Custom Range</Option>
              </Select>
              {reportPeriod === 'custom' && (
                <RangePicker value={reportRange} onChange={setReportRange} allowClear={false} />
              )}
              <Button type="primary" icon={<SyncOutlined />} onClick={fetchData}>Update Report</Button>
            </Space>
          </div>

          {reportData ? (
            <div className="fade-in-premium">
              <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} md={8}>
                  <div className="stat-card-refined" style={{ borderLeft: '4px solid #10b981' }}>
                    <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>Gross Revenue</Text>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>
                      ETB {reportData.totalRevenue?.toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="stat-card-refined" style={{ borderLeft: '4px solid #ef4444' }}>
                    <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>Total Refunds</Text>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>
                      ETB {reportData.totalRefunds?.toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="stat-card-refined" style={{ borderLeft: '4px solid #4361ee' }}>
                    <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>Net Income</Text>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4361ee', marginTop: '8px' }}>
                      ETB {reportData.netIncome?.toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderRadius: '12px' }}>
                    <Statistic title="Successful Transactions" value={reportData.successCount} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderRadius: '12px' }}>
                    <Statistic title="Failed Transactions" value={reportData.failedCount} valueStyle={{ color: '#ef4444' }} prefix={<CloseCircleOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderRadius: '12px' }}>
                    <Statistic title="Avg. Order Value" value={reportData.avgOrderValue} precision={2} prefix="ETB" valueStyle={{ color: '#4361ee' }} />
                  </Card>
                </Col>
              </Row>

              <div className="section-header-premium">
                <Title level={5}>Payment Method Distribution</Title>
              </div>
              <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                {Object.entries(reportData.methodBreakdown || {}).map(([method, count]) => (
                  <Col key={method} xs={12} sm={8} lg={6}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <Text strong style={{ textTransform: 'uppercase', color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{method}</Text>
                      <Text style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{count}</Text>
                    </div>
                  </Col>
                ))}
                {Object.keys(reportData.methodBreakdown || {}).length === 0 && (
                  <Col span={24}>
                    <Alert message="No specific payment method data for this period." type="info" />
                  </Col>
                )}
              </Row>

              <Divider />
              <Space size="middle">
                <Button className="btn-primary-gradient" size="large" icon={<PrinterOutlined />} onClick={handleExportPDF}>Generate Official PDF Report</Button>
                <Button size="large" icon={<FileTextOutlined />} onClick={handleExportExcel}>Download CSV Data</Button>
              </Space>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Paragraph>No report data available. Please select a period and click Update.</Paragraph>
            </div>
          )}
        </Card>
      )}


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
              <Descriptions.Item label="Payment Status"><Tag color={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>{selectedOrder.paymentStatus?.toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Order Status"><Tag color="blue">{selectedOrder.status?.toUpperCase()}</Tag></Descriptions.Item>
              {selectedOrder.transactionRef && <Descriptions.Item label="Tx Ref">{selectedOrder.transactionRef}</Descriptions.Item>}
            </Descriptions>

            {selectedOrder.prescriptionRequired && (
              <>
                <Divider orientation="left">Prescription Verification</Divider>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Rx Required">Yes</Descriptions.Item>
                  <Descriptions.Item label="Verification Status">
                    <Tag color={selectedOrder.prescription?.status === 'verified' ? 'success' : (selectedOrder.prescription?.status === 'rejected' ? 'error' : 'warning')}>
                      {selectedOrder.prescription?.status?.toUpperCase() || 'PENDING'}
                    </Tag>
                  </Descriptions.Item>
                  {selectedOrder.prescription?.verifiedBy && (
                    <Descriptions.Item label="Verified By">
                      {selectedOrder.prescription.verifiedBy.firstName} {selectedOrder.prescription.verifiedBy.lastName}
                    </Descriptions.Item>
                  )}
                  {selectedOrder.prescription?.verifiedAt && (
                    <Descriptions.Item label="Verified At">
                      {new Date(selectedOrder.prescription.verifiedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {selectedOrder.prescription?.notes && (
                    <Descriptions.Item label="Pharmacist Notes">
                      {selectedOrder.prescription.notes}
                    </Descriptions.Item>
                  )}
                  {(selectedOrder.prescriptionImage || (selectedOrder.prescription?.images && selectedOrder.prescription.images.length > 0)) && (
                    <Descriptions.Item label="Prescription Image">
                      <Image
                        width={200}
                        src={selectedOrder.prescriptionImage || selectedOrder.prescription.images[0].url}
                        alt="Prescription"
                        fallback="https://via.placeholder.com/200?text=Prescription+Image"
                      />
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
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

      {/* NEW POS MODALS */}
      <ShiftManagement
        visible={shiftModalVisible}
        onClose={() => setShiftModalVisible(false)}
        onShiftUpdate={(shift) => {
          setCurrentShift(shift);
          fetchData();
        }}
      />

    </div>
  );
};

export default CashierDashboard;
