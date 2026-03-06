import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Register.css';

const { Title, Text } = Typography;

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

  return (
    <div className="register-container">
      <Card className="register-card">
        <div className="register-form-side">
          <div className="register-header">
            <Title level={3} className="register-title">Create Account</Title>
            <Text className="register-subtitle">Join us to start your wellness journey</Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input
                prefix={<UserOutlined className="text-secondary" />}
                placeholder="Abebe Bikila"
                size="large"
                className="clinical-input"
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
                prefix={<MailOutlined className="text-secondary" />}
                placeholder="abebe@example.com"
                size="large"
                className="clinical-input"
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
                prefix={<PhoneOutlined className="text-secondary" />}
                placeholder="+251 911..."
                size="large"
                className="clinical-input"
              />
            </Form.Item>

            <Form.Item>
              <div className="info-message">
                <InfoCircleOutlined />
                <Text style={{ fontSize: '13px', color: 'inherit' }}>
                  A secure password will be generated and sent to your email.
                </Text>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ height: '48px', borderRadius: '12px', fontWeight: 600 }}
              >
                Join MediLink
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text type="secondary">Already have an account? </Text>
              <Link to="/auth/login" style={{ fontWeight: 600 }}>Sign In</Link>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default Register;
