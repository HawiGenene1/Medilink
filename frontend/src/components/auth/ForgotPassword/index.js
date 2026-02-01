import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await api.post('/auth/request-reset', { email: values.email });
      if (response.data.success) {
        setSuccess(true);
        message.success('Password reset link sent to your email.');
      } else {
        setError(response.data.message || 'Failed to send reset link.');
        message.error(response.data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMsg = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 400, width: '100%' }}>
        <Alert
          message="Check Your Email"
          description="We have sent a password reset link to your email address. Please check your inbox (and spam folder) and follow the instructions to reset your password."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <div style={{ textAlign: 'center' }}>
          <Link to="/auth/login">
            <Button type="primary">Back to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form
      name="forgot-password"
      onFinish={onFinish}
      layout="vertical"
      style={{ maxWidth: 400, width: '100%' }}
    >
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <p style={{ color: '#666' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
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

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          Send Reset Link
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <Link to="/auth/login" style={{ color: '#666' }}>
          <ArrowLeftOutlined /> Back to Login
        </Link>
      </div>
    </Form>
  );
};

export default ForgotPasswordForm;
