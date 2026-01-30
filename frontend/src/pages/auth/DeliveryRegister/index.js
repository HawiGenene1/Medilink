import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Select, Row, Col, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CarOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './DeliveryRegister.css';

const { Option } = Select;

const DeliveryRegister = () => {
    const [loading, setLoading] = useState(false);
    const [vehicleType, setVehicleType] = useState(null);
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
                role: 'delivery',
                vehicleInfo: {
                    type: values.vehicleType,
                    licensePlate: values.licensePlate
                }
            };

            const result = await register(userData);

            if (result.success) {
                message.success('Registration successful! Please check your email for your password.');
                navigate('/auth/login');
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
        <div className="delivery-register-container">
            <Card
                title={
                    <div style={{ textAlign: 'center' }}>
                        <CarOutlined style={{ fontSize: '32px', color: '#1E88E5', marginBottom: '12px' }} />
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>Become a Delivery Partner</div>
                        <div style={{ fontSize: '14px', fontWeight: 400, color: '#64748b', marginTop: '4px' }}>
                            Join our clinical logistics network and start earning.
                        </div>
                    </div>
                }
                className="delivery-register-card"
                bordered={false}
            >
                <Form
                    name="deliveryRegister"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <div className="form-section-title">Personal Information</div>
                    <Row gutter={16}>
                        <Col xs={24}>
                            <Form.Item
                                label="Full Name"
                                name="name"
                                rules={[{ required: true, message: 'Please input your name!' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Enter your full name" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Please input your email!' },
                                    { type: 'email', message: 'Please enter a valid email!' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Phone Number"
                                name="phone"
                                rules={[{ required: true, message: 'Please input your phone number!' }]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="e.g., +251 9..." size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="form-section-title" style={{ marginTop: '24px' }}>Vehicle Information</div>
                    <Row gutter={16}>

                    </Row>

                    <Form.Item style={{ marginTop: '12px' }}>
                        <div className="info-message">
                            <InfoCircleOutlined />
                            <span>Accounts are subject to verification. A secure password will be emailed to you after clinical review.</span>
                        </div>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            className="register-btn"
                        >
                            Submit Application
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Link to="/auth/login" style={{ color: '#64748b' }}>
                            Already have an account? <span style={{ color: '#1E88E5', fontWeight: 600 }}>Login</span>
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default DeliveryRegister;
