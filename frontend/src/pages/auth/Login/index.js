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
      const result = await login(values);
      
      if (result.success) {
        message.success('Login successful!');
        
        // Redirect based on user role
        const role = result.user.role;
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

          <div style={{ textAlign: 'center' }}>
            <Link to="/register">
              Don't have an account? Register
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
