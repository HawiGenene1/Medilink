import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Steps } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    LockOutlined,
    PhoneOutlined,
    ShopOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { pharmacyOwnerAPI } from '../../../services/api';
import './OwnerRegister.css';

const { Title, Text } = Typography;
const { Step } = Steps;

const OwnerRegister = () => {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();

    // Get pharmacyId from URL query string
    const queryParams = new URLSearchParams(location.search);
    const urlPharmacyId = queryParams.get('pharmacyId');

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const registrationData = {
                ...values,
                pharmacyId: values.pharmacyId || urlPharmacyId,
                subscriptionPlan: 'FREE'
            };

            const result = await pharmacyOwnerAPI.register(registrationData);

            if (result.data.success) {
                message.success('Registration successful!');
                setCurrentStep(2); // Success step
            } else {
                message.error(result.data.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Owner Register error:', error);
            let errorMsg = 'An error occurred. Please try again.';

            if (!error.response) {
                errorMsg = 'Network error: Backend server might be unreachable. Please check if the server is running.';
            } else {
                const serverErrors = error.response?.data?.errors;
                errorMsg = serverErrors
                    ? serverErrors.map(e => `${e.field}: ${e.message}`).join(', ')
                    : error.response?.data?.message || errorMsg;
            }

            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        try {
            // Only validate fields for the current step
            if (currentStep === 0) {
                await form.validateFields(['fullName', 'email', 'password']);
            }
            setCurrentStep(prev => prev + 1);
        } catch (info) {
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="owner-register-container">
            <Card className="owner-register-card">
                <div className="owner-register-header">
                    <Title level={2}>Partner with MediLink</Title>
                    <Text type="secondary">Register as a Pharmacy Owner</Text>
                </div>

                <Steps current={currentStep} size="small" style={{ marginBottom: '32px' }}>
                    <Step title="Account" />
                    <Step title="Details" />
                    <Step title="Done" />
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    size="large"
                    onFinish={onFinish}
                    initialValues={{ pharmacyId: urlPharmacyId }}
                    preserve={true}
                >
                    <div hidden={currentStep !== 0}>
                        <Form.Item
                            name="fullName"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter your full name' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="John Doe" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Enter a valid email' }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="john@example.com" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Create Password"
                            rules={[
                                { required: true, message: 'Please create a password' },
                                { min: 6, message: 'Password must be at least 6 characters' }
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="******" />
                        </Form.Item>


                        <Button type="primary" block onClick={nextStep} style={{ height: '48px' }}>
                            Next Step
                        </Button>
                    </div>

                    <div hidden={currentStep !== 1}>
                        <Form.Item
                            name="phone"
                            label="Phone Number"
                            rules={[{ required: true, message: 'Please enter your phone number' }]}
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="+251 ..." />
                        </Form.Item>

                        <Form.Item
                            name="pharmacyId"
                            label="Pharmacy ID"
                            extra={urlPharmacyId ? "Auto-linked from your business registration" : "Enter the Pharmacy ID if it wasn't auto-filled"}
                            rules={[{ required: true, message: 'Pharmacy ID is required' }]}
                        >
                            <Input prefix={<ShopOutlined />} placeholder="Enter Pharmacy ID" />
                        </Form.Item>


                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button onClick={prevStep} style={{ flex: 1, height: '48px' }}>
                                Back
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{ flex: 2, height: '48px' }}
                            >
                                Register Account
                            </Button>
                        </div>
                    </div>
                </Form>

                {currentStep === 2 && (
                    <div className="registration-success">
                        <CheckCircleOutlined className="success-icon" />
                        <Title level={3}>Account Created!</Title>
                        <Text>Your pharmacy owner account has been successfully registered.</Text>
                        <Button
                            type="primary"
                            block
                            onClick={() => navigate('/auth/owner/login')}
                            style={{ marginTop: '24px', height: '48px' }}
                        >
                            Go to Login
                        </Button>
                    </div>
                )}

                {currentStep !== 2 && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Text type="secondary">
                            Already have an account? <Link to="/auth/owner/login">Sign In</Link>
                        </Text>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OwnerRegister;
