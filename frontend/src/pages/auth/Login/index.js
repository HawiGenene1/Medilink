import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (user) => {
    const role = user.role;
    const status = user.status;

    if (role === 'delivery' && status === 'pending') {
      navigate('/auth/delivery/onboarding');
      return;
    }

    switch (role) {
      case 'customer': navigate('/customer/home'); break;
      case 'pharmacy_staff': navigate('/pharmacy-staff/inventory'); break;
      case 'pharmacy_admin': navigate('/pharmacy-admin/dashboard'); break;
      case 'cashier': navigate('/cashier/dashboard'); break;
      case 'delivery': navigate('/delivery/dashboard'); break;
      case 'admin': navigate('/admin/dashboard'); break;
      default: navigate('/');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        if (result.requires2FA) {
          setRequires2FA(true);
          setTempUserId(result.tempId);
          setRecoveryEmail(result.email);
          setRecoveryPhone(result.phone);
          message.info('Security code sent to your recovery contacts');
        } else {
          message.success('Login successful!');
          handleRedirect(result.user);
        }
      } else {
        message.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FA = async (values) => {
    setLoading(true);
    try {
      const result = await verify2FA(tempUserId, values.code);
      if (result.success) {
        message.success('Account verified!');
        handleRedirect(result.user);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="login-container">
        <Card title="Security Verification" className="login-card">
          <div style={{ marginBottom: 20 }}>
            <Text>Please enter the 6-digit security code sent to:</Text>
            <div style={{ marginTop: 8 }}>
              <b>{recoveryEmail}</b> {recoveryPhone && <>and <b>{recoveryPhone}</b></>}
            </div>
          </div>
          <Form onFinish={onVerify2FA} layout="vertical">
            <Form.Item
              name="code"
              label="Security Code"
              rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}
            >
              <Input size="large" placeholder="000000" style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Verify & Login
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button type="link" onClick={() => setRequires2FA(false)}>Back to Login</Button>
            </div>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Card
        title="Login to MediLink"
        className="login-card"
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <Link to="/auth/forgot-password" style={{ fontSize: '13px' }}>
              Forgot password?
            </Link>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Log in
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Link to="/auth/register">
              Don't have an account? Register
            </Link>
          </div>

          <div style={{ textAlign: 'center', padding: '12px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>Want to earn with MediLink? </span>
            <Link to="/auth/delivery/register" style={{ fontWeight: 600, color: '#1E88E5' }}>
              Become a Delivery Partner
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

const { Text } = Typography;

export default Login;
