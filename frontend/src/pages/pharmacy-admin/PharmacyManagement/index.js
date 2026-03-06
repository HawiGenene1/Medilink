import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Modal, Descriptions, Input, Form, message, List, Spin, Alert, Row, Col, Statistic, Select } from 'antd';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { BASE_URL } from '../../../services/api';
import pharmacyAdminService from '../../../services/pharmacyAdminService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PharmacyRegistration = () => {
  const [stats, setStats] = useState({ totalRequests: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [form] = Form.useForm();

  const { current: currentPage, pageSize } = pagination;

  const fetchStats = useCallback(async () => {
    try {
      const response = await pharmacyAdminService.getDashboardStats();
      // Map backend response to our needs
      // Note: backend 'active' pharmacies are essentially 'approved' registrations that proceeded
      setStats({
        totalRequests: response.data.pharmacies.totalRequests || 0,
        pending: response.data.pharmacies.pending || 0,
        approved: response.data.pharmacies.approved || 0,
        rejected: response.data.pharmacies.rejected || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyAdminService.getRegistrations({
        status: 'pending',
        page: currentPage,
        limit: pageSize,
        search: searchText
      });

      setRequests(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      message.error('Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [fetchRegistrations, fetchStats]);

  const showDetails = async (record) => {
    try {
      const response = await pharmacyAdminService.getRegistrationDetails(record._id);
      setSelectedRequest(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching registration details:', error);
      message.error('Failed to load registration details');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await pharmacyAdminService.approveRegistration(selectedRequest._id, selectedPlan);
      message.success(`Pharmacy ${selectedRequest.pharmacyName} has been approved with ${selectedPlan.toUpperCase()} plan!`);
      setIsModalOpen(false);
      fetchRegistrations(); // Refresh list
    } catch (error) {
      console.error('Error approving registration:', error);
      message.error(error.response?.data?.message || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    setRejectModalOpen(true);
  };

  const submitReject = async (values) => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await pharmacyAdminService.rejectRegistration(selectedRequest._id, values.reason);
      message.success(`Registration for ${selectedRequest.pharmacyName} has been rejected`);
      setRejectModalOpen(false);
      setIsModalOpen(false);
      form.resetFields();
      fetchRegistrations(); // Refresh list
    } catch (error) {
      console.error('Error rejecting registration:', error);
      message.error(error.response?.data?.message || 'Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text strong>{id.substring(id.length - 8).toUpperCase()}</Text>
    },
    {
      title: 'Pharmacy Name',
      dataIndex: 'pharmacyName',
      key: 'pharmacyName',
    },
    {
      title: 'Owner',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'License Number',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: 'License Status',
      key: 'licenseStatus',
      render: (_, record) => {
        if (!record.licenseExpiryDate) return <Tag color="default">Unverified</Tag>;
        const expiry = new Date(record.licenseExpiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <Tag color="error">Expired</Tag>;
        if (diffDays <= 180) return <Tag color="warning">Near Expiration</Tag>;
        return <Tag color="success">Valid</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Submitted Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => showDetails(record)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div className="welcome-section" style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>Pharmacy Registrations</Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>Review and manage platform registration requests</Text>
      </div>

      {/* Stats Banner Mini */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col span={24}>
          <div className="stats-banner-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Pending Review</Text>
              <Title level={2} style={{ margin: 0, color: '#faad14' }}>{stats.pending}</Title>
            </div>
            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Approved</Text>
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{stats.approved}</Title>
            </div>
            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Rejected</Text>
              <Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>{stats.rejected}</Title>
            </div>
            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
            <div className="banner-stat">
              <Text type="secondary" style={{ fontSize: '13px' }}>Total Requests</Text>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{stats.totalRequests}</Title>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="dashboard-card" style={{ borderRadius: '16px' }}>

        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search by pharmacy name, email, or license number"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ maxWidth: 500 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={<span><FileTextOutlined /> Review Registration Request</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
            loading={actionLoading}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleApprove}
            loading={actionLoading}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <Title level={4}>{selectedRequest.pharmacyName}</Title>
            <Descriptions bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Owner Name">{selectedRequest.ownerName}</Descriptions.Item>
              <Descriptions.Item label="License Number">{selectedRequest.licenseNumber}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedRequest.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedRequest.phone}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedRequest.address
                  ? `${selectedRequest.address.street || ''}, ${selectedRequest.address.city || ''}, ${selectedRequest.address.state || ''} ${selectedRequest.address.postalCode || ''}, ${selectedRequest.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim()
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="TIN Number">{selectedRequest.tinNumber || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedRequest.status === 'pending' ? 'orange' : 'green'}>
                  {selectedRequest.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date" span={2}>
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedRequest.documents && selectedRequest.documents.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Documents</Title>
                <List
                  size="small"
                  bordered
                  dataSource={selectedRequest.documents}
                  renderItem={(doc) => (
                    <List.Item
                      extra={
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            const url = typeof doc === 'string' ? doc : doc.url;
                            const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
                            window.open(absoluteUrl, '_blank');
                          }}
                        >
                          View
                        </Button>
                      }
                    >
                      <List.Item.Meta
                        avatar={<FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                        title={typeof doc === 'string' ? 'Registration Document' : doc.name}
                        description={typeof doc === 'string' ? 'Pharmacy Attachment' : `${doc.type.toUpperCase()} Certificate`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            <div style={{ marginTop: 24, padding: '16px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
              <Title level={5}>Subscription Plan Assignment</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Select a subscription plan to activate for this pharmacy upon approval.
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a subscription plan"
                value={selectedPlan}
                onChange={setSelectedPlan}
                size="large"
              >
                <Select.Option value="basic">Basic (Free)</Select.Option>
                <Select.Option value="standard">Standard (500 ETB/mo)</Select.Option>
                <Select.Option value="premium">Premium (1200 ETB/mo)</Select.Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Registration"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
      >
        <Form form={form} layout="vertical" onFinish={submitReject}>
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide a detailed reason for rejecting this application..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PharmacyRegistration;
