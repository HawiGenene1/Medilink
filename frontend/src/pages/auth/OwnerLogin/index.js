import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './OwnerLogin.css';

const { Title, Text } = Typography;

const OwnerLogin = () => {
    const [loading, setLoading] = useState(false);
    const { ownerLogin } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const result = await ownerLogin(values.email, values.password);

            if (result.success) {
                const isStaff = result.user.role === 'staff';
                message.success(isStaff ? 'Login successful! Welcome to the Staff Portal.' : 'Welcome back, Pharmacy Owner!');
                navigate('/owner/dashboard');
            } else {
                message.error(result.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            message.error('An error occurred. Please try again.');
            console.error('Owner Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="owner-login-container">
            <Card className="owner-login-card">
                <div className="owner-login-header">
                    <ShopOutlined className="owner-login-icon" />
                    <Title level={2}>Pharmacy Portal</Title>
                    <Text type="secondary">Login to manage your business</Text>
                </div>

                <Form
                    name="owner-login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Email Address"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            className="owner-login-button"
                        >
                            Sign In
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">
                            Don't have an owner account? <Link to="/auth/owner/register">Register Business</Link>
                        </Text>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Link to="/auth/login" style={{ fontSize: '13px' }}>
                            Switch to Customer Login
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default OwnerLogin;
