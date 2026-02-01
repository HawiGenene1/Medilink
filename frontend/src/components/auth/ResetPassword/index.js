import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const ResetPasswordForm = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useParams();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        if (values.password !== values.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/auth/reset-password/${token}`, {
                newPassword: values.password
            });

            if (response.data.success) {
                setSuccess(true);
                message.success('Password has been reset successfully!');
                setTimeout(() => {
                    navigate('/auth/login');
                }, 3000);
            } else {
                setError(response.data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
                <Alert
                    message="Password Reset Successful"
                    description="Your password has been successfully reset. You can now login with your new password. Redirecting to login..."
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Link to="/auth/login">
                    <Button type="primary">Go to Login</Button>
                </Link>
            </div>
        );
    }

    return (
        <Form
            name="reset-password"
            onFinish={onFinish}
            layout="vertical"
            style={{ maxWidth: 400, width: '100%' }}
        >
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <h3>Set New Password</h3>
                <p style={{ color: '#666' }}>
                    Please enter your new password below.
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
                name="password"
                rules={[
                    { required: true, message: 'Please input your new password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="New Password"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirm New Password"
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
                    Reset Password
                </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
                <Link to="/auth/login" style={{ color: '#666' }}>
                    Back to Login
                </Link>
            </div>
        </Form>
    );
};

export default ResetPasswordForm;
