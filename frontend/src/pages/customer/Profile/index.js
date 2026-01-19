import React, { useState } from 'react';
import { Row, Col, Card, Typography, Form, Input, Button, Tabs, Avatar, Switch, List, Tag, Space } from 'antd';
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

const { Title, Text } = Typography;

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  // Mock Addresses
  const addresses = [
    { id: 1, type: 'Home', address: 'Bole, Addis Ababa, House 123', default: true },
    { id: 2, type: 'Work', address: 'Kazanchis, Office 404', default: false },
  ];

  const renderProfileForm = () => (
    <Form layout="vertical" initialValues={{
      firstName: user?.firstName || 'John',
      lastName: user?.lastName || 'Doe',
      email: user?.email || 'customer@medilink.com',
      phone: '+251 911 22 33 44'
    }}>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label="First Name" name="firstName">
            <Input disabled={!editing} prefix={<UserOutlined />} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Last Name" name="lastName">
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
        <Button type="primary">Save Changes</Button>
      )}
    </Form>
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
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
          {renderProfileForm()}
        </>
      )
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
              <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#4361ee' }} />
              <Button
                shape="circle"
                icon={<UploadOutlined />}
                size="small"
                style={{ position: 'absolute', bottom: 0, right: 0 }}
              />
            </div>
            <Title level={4} style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</Title>
            <Text type="secondary">Customer</Text>

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
