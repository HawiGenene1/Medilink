
import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Typography, Timeline } from 'antd';
import { UserOutlined, ShopOutlined, TransactionOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AdminDashboard = () => {

  // Mock Data
  const stats = {
    totalUsers: 10450,
    activePharmacies: 120,
    totalOrders: 45000,
    pendingApprovals: 8
  };

  const pendingPharmacies = [
    { key: '1', name: 'LifeCare Pharmacy', owner: 'Dawit M.', date: '2023-10-28', status: 'Pending' },
    { key: '2', name: 'Addis Meds', owner: 'Helen K.', date: '2023-10-27', status: 'Reviewing' },
    { key: '3', name: 'Bole Atlas Pharma', owner: 'Yonas B.', date: '2023-10-26', status: 'Pending' },
  ];

  const columns = [
    { title: 'Pharmacy Name', dataIndex: 'name', key: 'name' },
    { title: 'Owner', dataIndex: 'owner', key: 'owner' },
    { title: 'Applied Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color="orange">{status}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small">Review</Button>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <Title level={2}>System Overview</Title>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Pharmacies"
              value={stats.activePharmacies}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<TransactionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingApprovals}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Pending Approvals Table */}
        <Col xs={24} lg={16}>
          <Card title="Pharmacy Registration Requests" extra={<Button type="link">View All</Button>}>
            <Table
              columns={columns}
              dataSource={pendingPharmacies}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* System Activity Timeline */}
        <Col xs={24} lg={8}>
          <Card title="Recent System Activity">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>New user registration spike</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>10 mins ago</Text>
                    </>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text>PharmAcity v2.0 deployment success</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>2 hours ago</Text>
                    </>
                  ),
                },
                {
                  color: 'red',
                  children: (
                    <>
                      <Text>Reported issue: Payment Gateway Latency</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>4 hours ago</Text>
                    </>
                  ),
                },
                {
                  children: (
                    <>
                      <Text>Daily database backup completed</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Yesterday</Text>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
