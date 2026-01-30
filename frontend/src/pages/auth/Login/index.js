import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        message.success('Login successful!');

        // Redirect based on user role
        const role = result.user.role;
        const status = result.user.status;

        console.log('[Login Debug] Role:', role, 'Status:', status);

        // Pending delivery users explicitly goto onboarding
        if (role === 'delivery' && status === 'pending') {
          navigate('/auth/delivery/onboarding');
          return;
        }

        switch (role) {
          case 'customer':
            navigate('/customer/home');
            break;
          case 'pharmacy_staff':
            navigate('/pharmacy-staff/inventory');
            break;
          case 'pharmacy_admin':
            navigate('/pharmacy-admin/dashboard');
            break;
          case 'cashier':
            navigate('/cashier/dashboard');
            break;
          case 'delivery':
            // Active delivery users go to dashboard
            navigate('/delivery/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        message.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      message.error('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Dev Helper - Quick Login */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>Demo Quick Login:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <Button size="small" onClick={() => onFinish({ email: 'customer@test.com', password: 'customer123' })}>Customer</Button>
              <Button size="small" onClick={() => onFinish({ email: 'pharmacy@test.com', password: 'pharmacy123' })}>Pharmacy</Button>
              <Button size="small" onClick={() => onFinish({ email: 'admin@medilink.com', password: 'admin123' })}>Admin</Button>
              <Button size="small" onClick={() => onFinish({ email: 'staff@test.com', password: 'staff123' })}>Staff</Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
