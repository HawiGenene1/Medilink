import React, { useState, useRef } from 'react';
import { Row, Col, Card, Typography, Form, Input, Button, Tabs, Avatar, Switch, List, Tag, Space, App } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { Title, Text } = Typography;

const Profile = () => {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      // Upload to backend
      const response = await api.post('/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local user context if needed
      // Ideally AuthContext should provide a way to update user data
      // For now, we rely on the reload or manual local storage update
      const updatedUser = { ...user, avatar: response.data.avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      message.success('Profile image updated successfully');
      // Simple reload to refresh context
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Mock Addresses
  const addresses = [
    { id: 1, type: 'Home', address: 'Bole, Addis Ababa, House 123', default: true },
    { id: 2, type: 'Work', address: 'Kazanchis, Office 404', default: false },
  ];

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await api.put('/users/profile', values);
      message.success('Profile updated successfully');
      setEditing(false);
      // Optional: Update local storage/context if needed, though reload is usually safer for global state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Update failed:', error);
      message.error('Failed to update profile');
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
      <List.Item>
        <List.Item.Meta
          title={<Text type="secondary">Verification Status</Text>}
          description={
            <Space>
              <Tag color="success">Email Verified</Tag>
              <Tag color="success">Phone Verified</Tag>
            </Space>
          }
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
          <Button type="dashed" block style={{ marginBottom: '16px' }}>+ Add New Address</Button>
          <List
            dataSource={addresses}
            renderItem={item => (
              <List.Item actions={[<Button type="link" key="edit">Edit</Button>, <Button type="link" key="del" danger>Delete</Button>]}>
                <List.Item.Meta
                  avatar={<Avatar icon={<EnvironmentOutlined />} style={{ backgroundColor: '#f0f0f0', color: '#000' }} />}
                  title={
                    <Space>
                      <Text strong>{item.type}</Text>
                      {item.default && <Tag color="blue">Default</Tag>}
                    </Space>
                  }
                  description={item.address}
                />
              </List.Item>
            )}
          />
        </>
      )
    },
    {
      key: '3',
      label: 'Security',
      children: (
        <List>
          <List.Item actions={[<Button key="chg">Change</Button>]}>
            <List.Item.Meta
              avatar={<SafetyCertificateOutlined style={{ fontSize: '24px' }} />}
              title="Password"
              description="Last changed 3 months ago"
            />
          </List.Item>
          <List.Item actions={[<Switch key="2fa" />]}>
            <List.Item.Meta
              title="Two-Factor Authentication"
              description="Enable 2FA for enhanced security"
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
              <Avatar size={100} icon={<UserOutlined />} src={user?.avatar ? `http://localhost:5000${user.avatar}` : null} style={{ backgroundColor: '#4361ee', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
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
                capture="user"
              />
            </div>
            <Title level={4} style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>{user?.email}</Text>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={8}>
              <Col span={12}>
                <Card size="small" bordered={false} style={{ background: '#f8f9fa' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Orders</Text><br />
                  <Text strong>12</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" bordered={false} style={{ background: '#f8f9fa' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Rx Files</Text><br />
                  <Text strong>4</Text>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> <Text>Email Verified</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> <Text>Phone Verified</Text>
              </div>
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
    </div>
  );
};

export default Profile;
