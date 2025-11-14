import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
            <Title level={2}>Welcome to MediLink!</Title>
            <Text style={{ fontSize: '18px' }}>
              Hello, {user?.firstName} {user?.lastName}
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Space direction="vertical">
              <Text>Email: {user?.email}</Text>
              <Text>Phone: {user?.phone}</Text>
              <Text>Role: {user?.role}</Text>
            </Space>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Button 
              type="primary" 
              danger
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              size="large"
            >
              Logout
            </Button>
          </div>

          <div style={{ 
            marginTop: '40px', 
            padding: '20px', 
            background: '#f0f2f5', 
            borderRadius: '8px' 
          }}>
            <Title level={4}>✅ Authentication Integration Complete!</Title>
            <Text>
              Your frontend is now successfully connected to the backend API. 
              You can register new users, login, and manage authentication state.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Home;
