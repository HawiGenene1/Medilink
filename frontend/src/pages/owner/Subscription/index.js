import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Tag, Space, Row, Col, List, Divider, message, Modal, Empty } from 'antd';
import {
    CreditCardOutlined,
    RocketOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
    CrownOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const MOCK_SUBSCRIPTION = {
    plan: 'BASIC', // FREE, BASIC, PREMIUM
    status: 'ACTIVE', // ACTIVE, EXPIRED
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    features: [
        'Up to 5 staff members',
        'Basic business reporting',
        'Inventory oversight',
        'Customer management',
        'Email support'
    ]
};

const PLAN_THEMES = {
    FREE: { color: 'default', icon: <UserOutlined />, label: 'FREE' },
    BASIC: { color: 'blue', icon: <RocketOutlined />, label: 'BASIC' },
    PREMIUM: { color: 'gold', icon: <CrownOutlined />, label: 'PREMIUM' }
};

const Subscription = () => {
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
    const { user } = useAuth();
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setSubscription(MOCK_SUBSCRIPTION);
            setLoading(false);
        }, 500);
    };

    const handleUpgrade = () => {
        setIsUpgradeModalVisible(true);
    };

    const handleRenew = () => {
        message.info('Subscription renewal logic will be implemented with the payment gateway.');
    };

    const theme = PLAN_THEMES[subscription?.plan || 'FREE'];

    if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Space size="middle" align="center">
                        <Title level={2} style={{ marginBottom: 0 }}>Subscription Management</Title>
                        {isDev && <Tag color="orange">Mock Mode</Tag>}
                    </Space>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Manage your business tier, billing cycles, and included features.</Text>
                    </div>
                </div>
                <Space>
                    <Button icon={<CalendarOutlined />} onClick={() => message.info('Billing history feature coming soon!')}>
                        Billing History
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<Space><SafetyCertificateOutlined /> Current Plan Details</Space>}
                        extra={<Tag color={subscription?.status === 'ACTIVE' ? 'green' : 'red'}>{subscription?.status}</Tag>}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Paragraph>
                                    <Text type="secondary">Product Tier</Text>
                                    <br />
                                    <Tag color={theme.color} icon={theme.icon} style={{ fontSize: '14px', padding: '4px 12px' }}>
                                        {theme.label} PLAN
                                    </Tag>
                                </Paragraph>
                            </Col>
                            <Col span={12}>
                                <Paragraph>
                                    <Text type="secondary">Billing Cycle</Text>
                                    <br />
                                    <Text strong>{subscription?.startDate} → {subscription?.endDate}</Text>
                                </Paragraph>
                            </Col>
                        </Row>

                        <Divider />

                        <Title level={5}>Included Features</Title>
                        <List
                            dataSource={subscription?.features}
                            renderItem={item => (
                                <List.Item style={{ borderBlockEnd: 'none', padding: '8px 0' }}>
                                    <Space>
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        <Text>{item}</Text>
                                    </Space>
                                </List.Item>
                            )}
                        />

                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                            <Button type="primary" size="large" onClick={handleUpgrade}>
                                Upgrade Plan
                            </Button>
                            <Button size="large" onClick={handleRenew}>
                                Renew Subscription
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title={<Space><CreditCardOutlined /> Payment Method</Space>}>
                        <Empty
                            description="No payment method linked"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="dashed" block>Add Card</Button>
                        </Empty>
                    </Card>

                    <Card style={{ marginTop: '24px' }} title="Subscription Tips">
                        <Paragraph>
                            <Text type="secondary">
                                Professional pharmacies often prefer the <b>PREMIUM</b> plan for multi-branch reporting and advanced staff analytics.
                            </Text>
                        </Paragraph>
                        <Button type="link" style={{ padding: 0 }}>View all plans</Button>
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Choose a New Plan"
                open={isUpgradeModalVisible}
                onCancel={() => setIsUpgradeModalVisible(false)}
                footer={null}
                width={800}
            >
                <Row gutter={16}>
                    {['BASIC', 'PREMIUM'].map(p => (
                        <Col span={12} key={p}>
                            <Card
                                hoverable
                                style={{ textAlign: 'center', borderColor: p === 'PREMIUM' ? '#faad14' : '#f0f0f0' }}
                                title={p}
                            >
                                <Title level={3}>${p === 'BASIC' ? '19.99' : '49.99'}<small>/mo</small></Title>
                                <Button type={p === 'PREMIUM' ? 'primary' : 'default'} block>Select Plan</Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Modal>
        </div>
    );
};

export default Subscription;
