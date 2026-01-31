import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Tag,
    Descriptions,
    Button,
    Space,
    Avatar,
    Divider,
    Skeleton,
    message
} from 'antd';
import {
    UserOutlined,
    MedicineBoxOutlined,
    CreditCardOutlined,
    LockOutlined,
    EditOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { pharmacyOwnerAPI } from '../../../services/api';

const { Title, Text } = Typography;

const OwnerProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isDev = process.env.NODE_ENV === 'development';
    const [loading, setLoading] = useState(!isDev);
    const [pharmacy, setPharmacy] = useState(isDev ? { name: 'Sample Pharmacy', licenseNumber: 'ML-789-2023' } : null);
    const [subscription, setSubscription] = useState(isDev ? { plan: 'BASIC', status: 'ACTIVE', endDate: '2026-12-31' } : null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            if (!isDev) setLoading(true);
            // In a real app, these would be separate calls or one consolidated profile call
            const [pharmacyRes, subRes] = await Promise.all([
                pharmacyOwnerAPI.getPharmacy(),
                pharmacyOwnerAPI.getSubscription()
            ]);

            if (pharmacyRes.data.success) setPharmacy(pharmacyRes.data.data);
            if (subRes.data.success) setSubscription(subRes.data.data);

        } catch (error) {
            console.error('Failed to fetch profile supplemental data:', error);
            if (!isDev && error.response?.status !== 401) {
                message.error('Failed to load some profile details');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px' }}>
                <Skeleton active avatar paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Space size="large">
                    <Avatar size={84} icon={<UserOutlined />} src={user?.avatar} />
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>{user?.fullName || 'Pharmacy Owner'}</Title>
                        <Space>
                            <Tag color="blue">{user?.role?.replace('_', ' ')}</Tag>
                            {user?.isActive && <Tag color="green">ACTIVE ACCOUNT</Tag>}
                        </Space>
                    </div>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><UserOutlined /> Account Information</Space>}
                        extra={<Button type="link" onClick={() => navigate('/owner/settings')}>Edit Settings</Button>}
                    >
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Full Name">{user?.fullName}</Descriptions.Item>
                            <Descriptions.Item label="Email Address">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{user?.phone || 'Not provided'}</Descriptions.Item>
                            <Descriptions.Item label="Account Role">
                                <Text strong>{user?.role}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Member Since">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card
                        title={<Space><MedicineBoxOutlined /> Linked Pharmacy</Space>}
                        style={{ marginTop: 24 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>{pharmacy?.name || 'My Pharmacy'}</Title>
                                <Text type="secondary">{pharmacy?.licenseNumber || 'License: ---'}</Text>
                            </div>
                            <Button
                                type="primary"
                                ghost
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate('/owner/pharmacy')}
                            >
                                View Details
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><CreditCardOutlined /> Subscription Summary</Space>}
                        extra={<Button type="link" onClick={() => navigate('/owner/subscription')}>Manage Plan</Button>}
                    >
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <Tag color="gold" icon={<SafetyCertificateOutlined />} style={{ fontSize: '16px', padding: '8px 16px', marginBottom: 16 }}>
                                {subscription?.plan || user?.subscriptionPlan || 'BASIC'} PLAN
                            </Tag>
                            <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                                <Descriptions.Item label="Status">
                                    <BadgeStatus status={subscription?.status || user?.subscriptionStatus} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Renews/Expires On">
                                    <Text strong>{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '---'}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </Card>

                    <Card
                        title={<Space><LockOutlined /> Security & Access</Space>}
                        style={{ marginTop: 24 }}
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Password">********</Descriptions.Item>
                            <Descriptions.Item label="Two-Factor Auth">
                                <Tag color="default">Disabled</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        <Button
                            block
                            icon={<EditOutlined />}
                            onClick={() => navigate('/owner/settings?tab=security')}
                        >
                            Change Password
                        </Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// Helper component for badge status
const BadgeStatus = ({ status }) => {
    const isActive = status === 'ACTIVE';
    return (
        <Space>
            <CheckCircleOutlined style={{ color: isActive ? '#52c41a' : '#ff4d4f' }} />
            <Text style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>{status || 'UNKNOWN'}</Text>
        </Space>
    );
};

export default OwnerProfile;
