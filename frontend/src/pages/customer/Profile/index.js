import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Typography, Form, Input, Button, Tabs, Avatar, Switch, List, Tag, Space, App, Divider, Modal, message as antdMessage } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  CameraOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const antApp = App.useApp();
  const message = antApp?.message || antdMessage;

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);

  const [addressForm] = Form.useForm();
  const [twoFactorForm] = Form.useForm();
  const fileInputRef = useRef(null);

  // Sync 2FA form when user data loads
  React.useEffect(() => {
    if (user) {
      twoFactorForm.setFieldsValue({
        recoveryEmail: user.recoveryEmail || user.email,
        recoveryPhone: user.recoveryPhone || ''
      });
    }
  }, [user, twoFactorForm]);

  // Refresh user data when component mounts to ensure we have latest settings
  useEffect(() => {
    refreshUser();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await api.post('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      message.success('Profile image updated successfully');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await api.put('/users/profile', values);
      message.success('Profile updated successfully');
      setEditing(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      console.error('Update failed:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (values) => {
    setLoading(true);
    try {
      const currentAddresses = user?.addresses || [];
      const updatedAddresses = [...currentAddresses, { ...values, isDefault: currentAddresses.length === 0 }];

      await api.put('/users/profile', { addresses: updatedAddresses });
      message.success('Address added successfully');
      setAddressModalVisible(false);
      addressForm.resetFields();
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      message.error('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async (values) => {
    console.log('[2FA Setup] Submitting values:', values);
    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        ...values,
        // We only save the recovery info, we DON'T enable login 2FA
        // isTwoFactorEnabled: true 
      });
      console.log('[Recovery Setup] Success:', response.data);
      message.success('Account recovery options updated!');
      setTwoFactorModalVisible(false);
      await refreshUser();
    } catch (error) {
      console.error('[2FA Setup] Failed:', error);
      const errorMsg = error.response?.data?.message || 'Failed to enable 2FA';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderProfileForm = () => (
    <Form
      layout="vertical"
      onFinish={handleProfileUpdate}
      initialValues={{
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || ''
      }}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input disabled={!editing} prefix={<UserOutlined />} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter your last name' }]}
          >
            <Input disabled={!editing} prefix={<UserOutlined />} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Email" name="email">
            <Input disabled prefix={<MailOutlined />} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Phone Number" name="phone">
            <Input disabled={!editing} prefix={<PhoneOutlined />} />
          </Form.Item>
        </Col>
      </Row>
      {editing && (
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginTop: '16px' }}>
          Save Identity Changes
        </Button>
      )}
    </Form>
  );

  const AccountDetails = () => (
    <List>
      <List.Item>
        <List.Item.Meta
          title={<Text type="secondary">User ID</Text>}
          description={<Text strong>{user?._id || 'N/A'}</Text>}
        />
      </List.Item>
      <List.Item>
        <List.Item.Meta
          title={<Text type="secondary">Account Role</Text>}
          description={<Tag color="blue">{user?.role?.toUpperCase() || 'CUSTOMER'}</Tag>}
        />
      </List.Item>
      <List.Item>
        <List.Item.Meta
          title={<Text type="secondary">Member Since</Text>}
          description={<Text strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>}
        />
      </List.Item>
    </List>
  );

  const tabItems = [
    {
      key: '1',
      label: 'Personal Information',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Title level={5}>Basic Details</Title>
            <Button
              type={editing ? 'default' : 'primary'}
              icon={<EditOutlined />}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit Identity'}
            </Button>
          </div>
          {renderProfileForm()}
        </>
      )
    },
    {
      key: 'accountId',
      label: 'Account Details',
      children: <AccountDetails />
    },
    {
      key: '2',
      label: 'Addresses',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddressModalVisible(true)}
            >
              Add Address
            </Button>
          </div>
          <List
            dataSource={user?.addresses || []}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<EnvironmentOutlined />} style={{ backgroundColor: '#f0f0f0', color: '#000' }} />}
                  title={
                    <Space>
                      <Text strong>{item.label}</Text>
                      {item.isDefault && <Tag color="blue">Default</Tag>}
                    </Space>
                  }
                  description={`${item.street}, ${item.city}, ${item.country}`}
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No addresses saved.' }}
          />
        </>
      )
    },
    {
      key: '3',
      label: 'Security',
      children: (
        <List>
          <List.Item>
            <List.Item.Meta
              avatar={<SafetyCertificateOutlined style={{ fontSize: '24px' }} />}
              title="Password"
              description={`Last changed: ${user?.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleString() : 'Never'}`}
            />
          </List.Item>
          <List.Item actions={[
            <Button
              type="primary"
              ghost
              onClick={() => setTwoFactorModalVisible(true)}
            >
              {user?.recoveryEmail || user?.recoveryPhone ? 'Update Options' : 'Set Up Recovery'}
            </Button>
          ]}>
            <List.Item.Meta
              title="Account Recovery"
              description={
                user?.recoveryEmail
                  ? `Recovery enabled via ${user.recoveryEmail}`
                  : user?.recoveryPhone
                    ? `Recovery enabled via ${user.recoveryPhone}`
                    : 'Set up recovery options to regain access if you forget your password'
              }
            />
          </List.Item>
        </List>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Sidebar Info */}
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={user?.avatar ? `http://localhost:5000${user.avatar}` : null}
                style={{ backgroundColor: '#4361ee', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Button
                shape="circle"
                icon={<CameraOutlined />}
                size="middle"
                style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4361ee', color: '#fff', border: '2px solid #fff' }}
                onClick={triggerFileInput}
                loading={loading}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <Title level={4} style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>{user?.email}</Text>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ textAlign: 'left' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SafetyCertificateOutlined style={{ color: user?.isEmailVerified ? '#52c41a' : '#faad14' }} />
                  <Text>Email {user?.isEmailVerified ? 'Verified' : 'Pending'}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> <Text>Phone Verified</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} md={16}>
          <Card style={{ borderRadius: '16px', minHeight: '500px' }}>
            <Tabs defaultActiveKey="1" items={tabItems} />
          </Card>
        </Col>
      </Row>

      {/* Address Modal */}
      <Modal
        title="Add New Address"
        open={addressModalVisible}
        onCancel={() => setAddressModalVisible(false)}
        footer={null}
      >
        <Form form={addressForm} layout="vertical" onFinish={handleAddAddress}>
          <Form.Item name="label" label="Address Label" rules={[{ required: true }]}>
            <Input placeholder="Home, Work, etc." />
          </Form.Item>
          <Form.Item name="street" label="Street Address" rules={[{ required: true }]}>
            <Input placeholder="e.g. Bole Road, House 123" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input placeholder="Addis Ababa" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="Country" initialValue="Ethiopia">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Save Address
          </Button>
        </Form>
      </Modal>

      {/* 2FA Modal */}
      <Modal
        title="Update Account Recovery Options"
        open={twoFactorModalVisible}
        onCancel={() => setTwoFactorModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary">
            These contacts will be used to verify your identity if you forget your password or lose access to your primary email.
          </Text>
        </div>
        <Form form={twoFactorForm} layout="vertical" onFinish={handleSetup2FA}>
          <Form.Item
            name="recoveryEmail"
            label="Recovery Email"
            rules={[
              { required: true, message: 'Please provide a recovery email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
            initialValue={user?.email}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter email for security codes" />
          </Form.Item>
          <Form.Item
            name="recoveryPhone"
            label="Backup Phone (Optional)"
          >
            <Input prefix={<PhoneOutlined />} placeholder="+251..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block icon={<SafetyCertificateOutlined />} loading={loading}>
            Enable Secure Protection
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
