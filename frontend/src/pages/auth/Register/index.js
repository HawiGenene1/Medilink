import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './Register.css';

const { TabPane } = Tabs;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('customer');
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
        role: activeRole,
        additionalData: activeRole === 'customer' ? null : {
          ...(activeRole === 'pharmacy_admin' && {
            pharmacyName: values.pharmacyName,
            licenseNumber: values.licenseNumber,
            address: {
              street: values.street,
              city: values.city,
              state: values.state,
              zipCode: values.zipCode
            }
          })
        }
      };

      const result = await register(userData);

      if (result.success) {
        if (activeRole === 'customer') {
          message.success('Registration successful! Welcome to MediLink.');
          navigate('/customer/home');
        } else {
          message.success('Registration submitted! Your account is pending admin approval.');
          navigate('/auth/login');
        }
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

  const renderAddressFields = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          label="Street Address"
          name="street"
          rules={[{ required: true, message: 'Street is required' }]}
        >
          <Input placeholder="Street" />
        </Form.Item>
        <Form.Item
          label="City"
          name="city"
          rules={[{ required: true, message: 'City is required' }]}
        >
          <Input placeholder="City" />
        </Form.Item>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          label="State"
          name="state"
          rules={[{ required: true, message: 'State is required' }]}
        >
          <Input placeholder="State" />
        </Form.Item>
        <Form.Item
          label="Zip Code"
          name="zipCode"
          rules={[{ required: true, message: 'Zip Code is required' }]}
        >
          <Input placeholder="Zip Code" />
        </Form.Item>
      </div>
    </>
  );

  return (
    <div className="register-container">
      <Card
        title="Join MediLink"
        className="register-card"
        style={{ width: '100%', maxWidth: activeRole === 'customer' ? '450px' : '600px' }}
      >
        <Tabs activeKey={activeRole} onChange={setActiveRole} centered>
          <TabPane tab={<span><UserOutlined />Customer</span>} key="customer" />
          <TabPane tab={<span><ShopOutlined />Pharmacy</span>} key="pharmacy_admin" />
        </Tabs>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          {renderPersonalFields()}

          {activeRole === 'pharmacy_admin' && (
            <>
              <Form.Item
                label="Pharmacy Name"
                name="pharmacyName"
                rules={[{ required: true, message: 'Pharmacy name is required' }]}
              >
                <Input prefix={<ShopOutlined />} placeholder="Enter pharmacy name" />
              </Form.Item>
              <Form.Item
                label="License Number"
                name="licenseNumber"
                rules={[{ required: true, message: 'License number is required' }]}
              >
                <Input placeholder="Enter license number" />
              </Form.Item>
              {renderAddressFields()}
            </>
          )}


          <Form.Item>
            <div className="info-message">
              <InfoCircleOutlined />
              <span>
                {activeRole === 'customer'
                  ? 'A secure password will be generated and sent to your email.'
                  : 'Your application will be reviewed by our admin team.'}
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
              {activeRole === 'customer' ? 'Register' : 'Submit Application'}
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
