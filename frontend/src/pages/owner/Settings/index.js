import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Tabs,
    Form,
    Input,
    Button,
    Switch,
    List,
    Divider,
    message,
    Space,
    Row,
    Col,
    Alert
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
    ArrowRightOutlined,

    CreditCardOutlined,
    ToolOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { pharmacyOwnerAPI } from '../../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const OwnerSettings = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'account';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [accountForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Update active tab when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const handleTabChange = (key) => {
        setActiveTab(key);
        // Optional: Update URL without reloading to reflect current tab
        navigate(`/owner/settings?tab=${key}`, { replace: true });
    };

    const onAccountUpdate = async (values) => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.updateProfile(values);
            if (response.data.success) {
                message.success('Account settings updated successfully');
                if (updateUser) updateUser(response.data.owner);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update account settings');
        } finally {
            setLoading(false);
        }
    };

    const onPasswordUpdate = async (values) => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.updatePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            if (response.data.success) {
                message.success('Password updated successfully');
                passwordForm.resetFields();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const onOperationsUpdate = async (values) => {
        try {
            // Validate: require exactly one permission to be enabled
            const enabledCount = Object.values(values).filter(v => v === true).length;

            if (enabledCount === 0) {
                message.warning('Please enable at least one operational permission');
                return;
            }

            if (enabledCount === 2) {
                message.warning('Please choose only one operational permission at a time');
                return;
            }

            setLoading(true);
            // values comes as { manageInventory: true, prepareOrders: false }
            // we need to wrap it in operationalPermissions object
            const response = await pharmacyOwnerAPI.updateProfile({
                operationalPermissions: values
            });
            if (response.data.success) {
                message.success('Operational permissions updated');
                if (updateUser) updateUser(response.data.owner);
            }
        } catch (error) {
            message.error('Failed to update operational permissions');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: 'account',
            label: <Space><UserOutlined />Account</Space>,
            children: (
                <Card bordered={false}>
                    <Title level={4}>Account Information</Title>
                    <Paragraph type="secondary">Update your primary contact information and business profile.</Paragraph>
                    <Divider />
                    <Form
                        form={accountForm}
                        layout="vertical"
                        initialValues={{
                            fullName: user?.fullName,
                            phone: user?.phone,
                            email: user?.email
                        }}
                        onFinish={onAccountUpdate}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Full Name"
                                    name="fullName"
                                    rules={[{ required: true, message: 'Please enter your full name' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Phone Number"
                                    name="phone"
                                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                                >
                                    <Input placeholder="Phone Number" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Email Address (Login)" name="email">
                            <Input disabled prefix={<Text type="secondary">@</Text>} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Save Changes
                        </Button>
                    </Form>

                    <Divider />
                    <Title level={5}>Quick Links</Title>
                    <Card size="small" style={{ background: '#f5f5f5', cursor: 'pointer' }} onClick={() => navigate('/owner/subscription')}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                                <CreditCardOutlined style={{ color: '#1890ff' }} />
                                <Text strong>Manage Business Subscription</Text>
                            </Space>
                            <ArrowRightOutlined />
                        </Space>
                    </Card>
                </Card>
            )
        },
        {
            key: 'notifications',
            label: <Space><BellOutlined />Notifications</Space>,
            children: (
                <Card bordered={false}>
                    <Title level={4}>Notification Preferences</Title>
                    <Paragraph type="secondary">Control how you receive alerts and business updates.</Paragraph>
                    <Divider />
                    <List
                        itemLayout="horizontal"
                        dataSource={[
                            { title: 'Email Notifications', desc: 'Receive weekly performance reports and billing alerts via email.', default: true },
                            { title: 'In-app Alerts', desc: 'Real-time notifications for critical system updates and staff changes.', default: true },
                            { title: 'Marketing Updates', desc: 'Occasional emails about new features and pharmacy growth tips.', default: false }
                        ]}
                        renderItem={item => (
                            <List.Item
                                actions={[<Switch defaultChecked={item.default} onChange={() => message.success('Preference updated')} />]}
                            >
                                <List.Item.Meta
                                    title={item.title}
                                    description={item.desc}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )
        },
        {
            key: 'security',
            label: <Space><LockOutlined />Security</Space>,
            children: (
                <Card bordered={false}>
                    <Title level={4}>Security & Privacy</Title>
                    <Alert
                        message="Security Recommendation"
                        description="Ensure your password is at least 8 characters long and includes a mix of numbers and special characters."
                        type="info"
                        showIcon
                        icon={<SafetyCertificateOutlined />}
                        style={{ marginBottom: '24px' }}
                    />
                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={onPasswordUpdate}
                    >
                        <Form.Item
                            label="Current Password"
                            name="currentPassword"
                            rules={[{ required: true, message: 'Please enter your current password' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                        </Form.Item>
                        <Form.Item
                            label="New Password"
                            name="newPassword"
                            rules={[
                                { required: true, message: 'Please enter a new password' },
                                { min: 6, message: 'Password must be at least 6 characters' }
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                        </Form.Item>
                        <Form.Item
                            label="Confirm New Password"
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Please confirm your new password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
                        </Form.Item>
                        <Button type="primary" danger htmlType="submit" loading={loading}>
                            Update Password
                        </Button>
                    </Form>
                </Card>
            )
        },
        {
            key: 'operations',
            label: <Space><ToolOutlined />Operational Access (Advanced)</Space>,
            children: (
                <Card bordered={false}>
                    <Title level={4}>Advanced Operational Access</Title>
                    <Paragraph type="secondary">
                        By default, owners have <b>Oversight</b> (read-only) access. Enable these options only if you need to perform daily staff operational tasks.
                    </Paragraph>
                    <Alert
                        message="Warning: Operational Mode"
                        description="Enabling these features grants staff-level write access (e.g., packing orders, modifying stock). This is not required for management oversight."
                        type="warning"
                        showIcon
                        style={{ marginBottom: '24px' }}
                    />
                    <Form
                        layout="vertical"
                        initialValues={{
                            ...user?.operationalPermissions
                        }}
                        onFinish={onOperationsUpdate}
                    >
                        <Form.Item name="manageInventory" valuePropName="checked" label="Inventory Operations (Optional Access)">
                            <Switch checkedChildren="Management" unCheckedChildren="Read-Only" />
                        </Form.Item>
                        <Paragraph type="secondary" style={{ marginTop: '-10px', marginBottom: '24px' }}>
                            Enable to modify stock levels and product details. This provides optional access to staff-level functions and does not guarantee full operational capability.
                        </Paragraph>

                        <Form.Item name="prepareOrders" valuePropName="checked" label="Order Oversight (Optional Access)">
                            <Switch checkedChildren="Active" unCheckedChildren="ReadOnly" />
                        </Form.Item>
                        <Paragraph type="secondary" style={{ marginTop: '-10px', marginBottom: '24px' }}>
                            Default: <b>Read-Only Oversight</b> (View order status, track workflow progress, monitor delays).
                        </Paragraph>

                        <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#faad14', borderColor: '#faad14' }}>
                            Save Operational Settings
                        </Button>
                    </Form>
                </Card>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Title level={2}>Account Settings</Title>
                <Text type="secondary">Manage your business profile, security preferences, and dashboard alerts.</Text>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={items}
                type="card"
                className="custom-settings-tabs"
            />
        </div>
    );
};

export default OwnerSettings;
