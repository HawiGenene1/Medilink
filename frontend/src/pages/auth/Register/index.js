import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Register.css';

const { TabPane } = Tabs;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Split name into firstName and lastName
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Prepare user data for backend
      const userData = {
        firstName,
        lastName,
        email: values.email,
        phone: values.phone,
        role: 'customer'
      };

      const result = await register(userData);

      if (result.success) {
        message.success('Registration successful! Welcome to MediLink.');
        navigate('/customer/home');
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(err => {
            message.error(err.msg || err.message || 'An error occurred');
          });
        } else {
          message.error(result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      message.error('An error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalFields = () => (
    <>
      <Form.Item
        label="Full Name"
        name="name"
        rules={[{ required: true, message: 'Please input your name!' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Enter your full name"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="Enter your email"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Phone Number"
        name="phone"
        rules={[
          { required: true, message: 'Please input your phone number!' },
          { pattern: /^[\d\s\-+()]+$/, message: 'Please enter a valid phone number!' }
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="Enter your phone number"
          size="large"
        />
      </Form.Item>
    </>
  );

  return (
    <div className="register-container">
      <Card
        title="Join MediLink"
        className="register-card"
        style={{ width: '100%', maxWidth: '450px' }}
      >
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          {renderPersonalFields()}

          <Form.Item>
            <div className="info-message">
              <InfoCircleOutlined />
              <span>
                A secure password will be generated and sent to your email.
              </span>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Register
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/login">
              Already have an account? Login
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
