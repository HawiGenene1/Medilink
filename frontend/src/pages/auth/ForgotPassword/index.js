import React, { useState } from 'react';
import { Card, Form, Input, Button, List, Typography, message, Steps } from 'antd';
import { MailOutlined, PhoneOutlined, SafetyOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [recoveryCode, setRecoveryCode] = useState('');
  const navigate = useNavigate();

  // Step 0: Identify User
  const onIdentify = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/request-password-reset', { identifier: values.identifier });
      if (res.data.success) {
        setUserId(res.data.userId);
        setMethods(res.data.methods);
        setCurrentStep(1);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Acccount not found');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Code
  const onSelectMethod = async (method) => {
    setLoading(true);
    setSelectedMethod(method);
    try {
      const res = await api.post('/auth/send-recovery-code', {
        userId,
        type: method.type,
        value: method.value
      });
      if (res.data.success) {
        message.success(res.data.message);
        setCurrentStep(2);
      }
    } catch (error) {
      message.error('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify & Reset
  const onReset = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        userId,
        token: values.code,
        newPassword: values.password
      });
      if (res.data.success) {
        message.success(res.data.message);
        navigate('/auth/login');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: 500, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Account Recovery</Title>
          <Text type="secondary">Follow the steps to reset your password</Text>
        </div>

        <Steps current={currentStep} size="small" style={{ marginBottom: 32 }}>
          <Step title="Identify" />
          <Step title="Verify" />
          <Step title="Secure" />
        </Steps>

        {currentStep === 0 && (
          <Form onFinish={onIdentify} layout="vertical">
            <Form.Item
              label="Enter Email, Recovery Email or Phone"
              name="identifier"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input size="large" prefix={<UserOutlined />} placeholder="e.g. email@medilink.com or +251..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Find My Account
            </Button>
          </Form>
        )}

        {currentStep === 1 && (
          <div>
            <Text strong>Where should we send the code?</Text>
            <List
              style={{ marginTop: 16 }}
              dataSource={methods}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    marginBottom: 8,
                    opacity: loading ? 0.6 : 1
                  }}
                  onClick={() => !loading && onSelectMethod(item)}
                >
                  <List.Item.Meta
                    avatar={item.type.includes('email') ? <MailOutlined /> : <PhoneOutlined />}
                    title={
                      item.type === 'email' ? 'Primary Email' :
                        item.type === 'recovery_email' ? 'Recovery Email' :
                          item.type === 'phone' ? 'Primary Phone' : 'Backup Phone'
                    }
                    description={item.label}
                  />
                  <SafetyOutlined style={{ color: '#1890ff' }} />
                </List.Item>
              )}
            />
            <Button type="link" onClick={() => setCurrentStep(0)} style={{ padding: 0 }}>
              Try a different identifier
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <Form onFinish={onReset} layout="vertical" autoComplete="off">
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Text>We sent a 6-digit code to <b>{selectedMethod?.label}</b></Text>
            </div>
            <Form.Item
              name="code"
              label="Recovery Code"
              rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}
            >
              <Input
                size="large"
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="New Password"
              rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}
            >
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="Set a new secure password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Reset Password & Login
            </Button>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/auth/login">Back to Login</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
