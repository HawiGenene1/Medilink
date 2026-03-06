import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Steps, Button, Card, Form, Input, Select, DatePicker, Checkbox, Upload, Row, Col, Typography, message, Result, Space, Descriptions } from 'antd';
import {
    UserOutlined,
    CarOutlined,
    FileTextOutlined,
    SafetyOutlined,
    BankOutlined,
    BookOutlined,
    CameraOutlined,
    CheckCircleOutlined,
    UploadOutlined,
    InfoCircleOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import './DeliveryOnboarding.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

const DeliveryOnboarding = () => {
    const { user } = useAuth();
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const steps = [
        { title: 'Account', icon: <UserOutlined /> },
        { title: 'Personal', icon: <UserOutlined /> },
        { title: 'Vehicle', icon: <CarOutlined /> },
        { title: 'Documents', icon: <FileTextOutlined /> },
        { title: 'Background', icon: <SafetyOutlined /> },
        { title: 'Payment', icon: <BankOutlined /> },
        { title: 'Inspection', icon: <CameraOutlined /> },
        { title: 'Review', icon: <CheckCircleOutlined /> },
    ];

    useEffect(() => {
        if (user && user.status === 'active' && user.role === 'delivery') {
            navigate('/delivery/dashboard');
        }
        fetchOnboardingStatus();
    }, [user]);

    const fetchOnboardingStatus = async () => {
        try {
            const response = await api.get('/delivery/onboarding/status');
            if (response.data.success) {
                const profileData = response.data.data;
                setProfile(profileData);
                setCurrent(profileData.currentStep - 1);

                // Pre-fill form if data exists
                if (profileData.personalDetails || profileData.vehicleDetails || profileData.paymentInfo || profileData.documents) {
                    const formattedValues = {
                        ...profileData.personalDetails,
                        ...profileData.vehicleDetails,
                        ...profileData.paymentInfo,
                        ...profileData.documents,
                        type: profileData.vehicleDetails?.vehicleType // Map vehicleType to 'type' for the form
                    };

                    if (formattedValues.dateOfBirth) {
                        formattedValues.dateOfBirth = dayjs(formattedValues.dateOfBirth);
                    }

                    // Format path strings into FileList arrays for AntD Upload
                    const fileFields = [
                        'governmentId', 'workEligibility', 'driversLicense',
                        'vehicleRegistration', 'insuranceProof', 'bicycleOwnership',
                        'chequePhoto'
                    ];

                    fileFields.forEach(field => {
                        if (formattedValues[field] && typeof formattedValues[field] === 'string') {
                            formattedValues[field] = [{
                                uid: `-${field}`,
                                name: formattedValues[field].split('/').pop(),
                                status: 'done',
                                url: `http://localhost:5000/${formattedValues[field]}`
                            }];
                        }
                    });

                    // Handle inspectionPhotos array
                    if (profileData.inspection?.inspectionPhotos) {
                        formattedValues.inspectionPhotos = profileData.inspection.inspectionPhotos.map((path, idx) => ({
                            uid: `-inspection-${idx}`,
                            name: path.split('/').pop(),
                            status: 'done',
                            url: `http://localhost:5000/${path}`
                        }));
                    }

                    form.setFieldsValue(formattedValues);
                }

                // Set current step
                setCurrent(profileData.currentStep - 1);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            message.error('Failed to load onboarding progress');
        }
    };

    const next = async (values) => {
        setLoading(true);
        try {
            const stepNum = current + 1;

            const formData = new FormData();
            formData.append('step', stepNum);

            if (values) {
                // Steps that contain files: 
                // 4: Documents (Identity), 6: Payment Info (Cheque), 7: Inspection Photos
                const fileSteps = [4, 6, 7];

                if (fileSteps.includes(stepNum)) {
                    Object.keys(values).forEach(key => {
                        const val = values[key];
                        // AntD Upload with valuePropName="fileList" returns an array directly
                        if (Array.isArray(val)) {
                            val.forEach(file => {
                                if (file.originFileObj) {
                                    formData.append(key, file.originFileObj);
                                }
                            });
                        } else if (val && val.fileList) {
                            // Fallback for different upload configurations
                            val.fileList.forEach(file => {
                                if (file.originFileObj) {
                                    formData.append(key, file.originFileObj);
                                }
                            });
                        }
                    });
                }
                formData.append('data', JSON.stringify(values));
            }

            const response = await api.post('/delivery/onboarding/step', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                message.success(`Step ${stepNum} completed!`);

                // Determine next step
                let nextStepIndex = current + 1;

                setCurrent(nextStepIndex);
                setProfile(response.data.data);
            }
        } catch (error) {
            console.error('Error saving step:', error);
            message.error('Failed to save progress');
        } finally {
            setLoading(false);
        }
    };

    const isPendingReview = profile?.onboardingStatus === 'pending_review';

    const prev = () => {
        setCurrent(current - 1);
    };

    const renderStepContent = () => {
        if (isPendingReview && current < 7) {
            return (
                <Result
                    status="info"
                    title="Application Under Review"
                    subTitle="You have completed all onboarding steps. Our team is currently reviewing your documentation. We will notify you via email once your account is activated."
                    extra={[
                        <Button type="primary" key="home" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    ]}
                />
            );
        }

        switch (current) {
            case 0: // Step 1: Account Creation (Summary)
                return (
                    <div className="account-summary">
                        <Title level={4}>Account Information</Title>
                        <Paragraph>You have successfully created your MediLink account.</Paragraph>
                        <Descriptions bordered column={1} className="summary-list">
                            <Descriptions.Item label="Name">{user?.firstName} {user?.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{user?.phone}</Descriptions.Item>
                        </Descriptions>
                        <div className="terms-acceptance" style={{ marginTop: '24px' }}>
                            <Checkbox checked disabled>I accept the terms of service and privacy policy.</Checkbox>
                        </div>
                        <Button type="primary" onClick={() => setCurrent(1)} size="large" block style={{ marginTop: '24px' }}>
                            Update Personal Info <ArrowRightOutlined />
                        </Button>
                    </div>
                );

            case 1: // Personal Information
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Personal Details</Title>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Preferred Language" name="preferredLanguage" initialValue="English">
                                    <Select size="large">
                                        <Option value="English">English</Option>
                                        <Option value="Amharic">Amharic</Option>
                                        <Option value="Oromo">Oromo</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Title level={5} style={{ marginTop: '16px' }}>Residential Address</Title>
                        <Form.Item label="Street" name={['residentialAddress', 'street']} rules={[{ required: true }]}>
                            <Input placeholder="123 Main St" size="large" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="City" name={['residentialAddress', 'city']} rules={[{ required: true }]}>
                                    <Input placeholder="Addis Ababa" size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Zip Code" name={['residentialAddress', 'zipCode']}>
                                    <Input placeholder="1000" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Title level={5} style={{ marginTop: '16px' }}>Emergency Contact</Title>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Contact Name" name={['emergencyContact', 'name']} rules={[{ required: true }]}>
                                    <Input placeholder="Full Name" size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Phone" name={['emergencyContact', 'phone']} rules={[{ required: true }]}>
                                    <Input placeholder="+251..." size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>Save & Continue</Button>
                    </Form>
                );

            case 2: // Vehicle Selection
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Vehicle Details</Title>
                        <Form.Item label="Delivery Mode" name="type" rules={[{ required: true }]}>
                            <Select size="large" placeholder="Select your vehicle type" onChange={(val) => {
                                // Force re-render to update conditional fields if needed
                                form.setFieldsValue({ type: val });
                                // We might need component state to trigger re-render if form instance doesn't automatically
                                // But AntD form usually handles dependencies or we use shouldUpdate
                                // For simplicity, let's just rely on re-render. 
                                // Actually, better to use Form.useWatch or setState.
                                // Let's use setState for simplicity in this specific file context
                                setProfile(prev => ({ ...prev, vehicleDetails: { ...prev?.vehicleDetails, type: val } })); // Pseudo-update to trigger render
                            }}>
                                <Option value="car">🚗 Car</Option>
                                <Option value="motorcycle">🛵 Motorcycle / Scooter</Option>
                                <Option value="bicycle">🚴 Bicycle</Option>
                                <Option value="van">🛻 Van</Option>
                            </Select>
                        </Form.Item>

                        {/* Conditional Rendering based on vehicle type stored in profile or form */}
                        {/* We'll use a functional check or useWatch if available. Here we verify state driven approach */}
                        {/* Let's grab the value directly from form if profile state lags or initial */}
                        {(() => {
                            const vType = form.getFieldValue('type') || profile?.vehicleDetails?.vehicleType;
                            if (vType === 'bicycle') return null;

                            return (
                                <>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Make" name="make" rules={[{ required: true }]}>
                                                <Input placeholder="e.g. Toyota, Honda" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Model" name="model" rules={[{ required: true }]}>
                                                <Input placeholder="e.g. Corolla, Click" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="License Plate" name="licensePlate" rules={[{ required: true }]}>
                                                <Input placeholder="AA-12345" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Color" name="color">
                                                <Input placeholder="e.g. White, Black" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            );
                        })()}

                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>Save & Continue</Button>
                    </Form>
                );

            case 3: // Document Upload
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Identity & Eligibility</Title>
                        <Paragraph>Upload high-quality photos of your documents.</Paragraph>
                        <Form.Item label="Government ID (Passport / National ID)" name="governmentId" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Select File</Button>
                            </Upload>
                        </Form.Item>

                        {/* Conditional Docs for Non-Bicycle */}
                        {(() => {
                            const vType = form.getFieldValue('type') || profile?.vehicleDetails?.vehicleType;
                            if (vType === 'bicycle') return null;

                            return (
                                <>
                                    <Form.Item label="Driver's License" name="driversLicense" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                                        <Upload beforeUpload={() => false} maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Select File</Button>
                                        </Upload>
                                    </Form.Item>
                                    <Form.Item label="Vehicle Registration (Blue Book)" name="vehicleRegistration" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                                        <Upload beforeUpload={() => false} maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Select File</Button>
                                        </Upload>
                                    </Form.Item>
                                    <Form.Item label="Proof of Insurance" name="insuranceProof" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                                        <Upload beforeUpload={() => false} maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Select File</Button>
                                        </Upload>
                                    </Form.Item>
                                </>
                            );
                        })()}

                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>Upload & Continue</Button>
                    </Form>
                );

            case 4: // Background Check
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Background Check</Title>
                        <div className="background-info">
                            <SafetyOutlined className="bg-icon" />
                            <Paragraph>
                                To ensure consumer safety, MediLink performs a standard background check through our clinical security partners.
                            </Paragraph>
                            <Paragraph>
                                By continuing, you consent to a record check including driving history (if applicable) and criminal records.
                            </Paragraph>
                        </div>
                        <Form.Item name="consented" valuePropName="checked" rules={[{ required: true, message: 'You must consent to continue' }]}>
                            <Checkbox>I consent to a background check and certify all information is accurate.</Checkbox>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>Confirm Consent</Button>
                    </Form>
                );

            case 5: // Payment Setup
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Bank & Payment Setup</Title>
                        <Form.Item label="Bank Name" name="bankName" rules={[{ required: true }]}>
                            <Select size="large">
                                <Option value="CBE">Commercial Bank of Ethiopia (CBE)</Option>
                                <Option value="Dashen">Dashen Bank</Option>
                                <Option value="Awash">Awash Bank</Option>
                                <Option value="Abyssinia">Bank of Abyssinia</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Account Number" name="accountNumber" rules={[{ required: true }]}>
                            <Input placeholder="Enter your 13-digit account number" size="large" />
                        </Form.Item>
                        <Form.Item label="Payout Preference" name="preference" initialValue="weekly">
                            <Select size="large">
                                <Option value="weekly">Weekly Payout</Option>
                                <Option value="instant">Instant Pay (Per Delivery)</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Photo of Check or Bank Statement" name="chequePhoto" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Select Photo</Button>
                            </Upload>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>Save Payout Info</Button>
                    </Form>
                );

            case 6: // Vehicle Inspection
                return (
                    <Form form={form} layout="vertical" onFinish={next}>
                        <Title level={4}>Finalize Application</Title>
                        {(() => {
                            const vType = form.getFieldValue('type') || profile?.vehicleDetails?.vehicleType;
                            if (vType === 'bicycle') {
                                return (
                                    <div style={{ marginBottom: '24px' }}>
                                        <Paragraph>
                                            Since you are using a <strong>Bicycle</strong>, no formal vehicle inspection is required.
                                            Please click the button below to submit your application for review.
                                        </Paragraph>
                                        <div style={{ display: 'none' }}>
                                            <Form.Item name="inspectionPhotos" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                                                <Upload />
                                            </Form.Item>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <>
                                    <Paragraph>Take clear photos of your vehicle (Front, Side, Interior/Storage area).</Paragraph>
                                    <Form.Item name="inspectionPhotos" valuePropName="fileList" getValueFromEvent={e => e.fileList}>
                                        <Upload
                                            listType="picture-card"
                                            beforeUpload={() => false}
                                            multiple
                                        >
                                            <div style={{ marginTop: 8 }}>
                                                <CameraOutlined />
                                                <div style={{ marginTop: 8 }}>Upload Photo</div>
                                            </div>
                                        </Upload>
                                    </Form.Item>
                                </>
                            );
                        })()}
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            {(form.getFieldValue('type') || profile?.vehicleDetails?.vehicleType) === 'bicycle' ? 'Finalize & Submit Application' : 'Submit for Inspection'}
                        </Button>
                    </Form>
                );

            case 7: // Final Review (Renumbered from 8)
                return (
                    <Result
                        status="success"
                        title="Application Submitted!"
                        subTitle="Our clinical review team will verify your documents and background check. This usually takes 2-3 business days. We will email you once your account is activated."
                        extra={[
                            <Button type="primary" key="home" onClick={() => navigate('/')}>
                                Return to Home
                            </Button>,
                            <Button key="support">Contact Support</Button>
                        ]}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            <Card className="onboarding-card">
                <div className="onboarding-header">
                    <Title level={2}>Partner Onboarding</Title>
                    <Paragraph>Follow these steps to activate your delivery account.</Paragraph>
                </div>

                <Steps current={current} size="small" className="onboarding-steps">
                    {steps.map(item => (
                        <Step key={item.title} title={item.title} icon={item.icon} />
                    ))}
                </Steps>

                <div className="step-content-wrapper">
                    {renderStepContent()}
                </div>

                {current > 1 && current < 8 && (
                    <Button style={{ marginTop: '16px' }} onClick={prev}>
                        Previous
                    </Button>
                )}
            </Card>
        </div>
    );
};

export default DeliveryOnboarding;
