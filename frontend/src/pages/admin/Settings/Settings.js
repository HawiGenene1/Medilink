import React, { useState, useEffect } from 'react';
import {
    Card, Form, Input, Switch, Button, Select, Space,
    Typography, Row, Col, message, Spin, Tabs, InputNumber
} from 'antd';
import {
    SettingOutlined,
    SecurityScanOutlined,
    GlobalOutlined,
    MailOutlined,
    SaveOutlined,
    BellOutlined,
    DollarOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await adminService.getSystemSettings();
                if (response.success) {
                    setSettings(response.data);
                    form.setFieldsValue(response.data);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                message.error('Failed to load system settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [form]);

    const onFinish = async (values) => {
        try {
            setSaving(true);
            const response = await adminService.updateSystemSettings(values);
            if (response.success) {
                message.success('System settings updated successfully');
                setSettings(response.data);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            message.error('Failed to update system settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Loading System Configuration..." />
            </div>
        );
    }

    const items = [
        {
            key: 'general',
            label: <span><GlobalOutlined /> General</span>,
            children: (
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="appName"
                            label="Application Name"
                            rules={[{ required: true, message: 'Please enter app name' }]}
                        >
                            <Input placeholder="e.g. MediLink" />
                        </Form.Item>
                        <Form.Item
                            name="contactEmail"
                            label="System Contact Email"
                            rules={[{ required: true, type: 'email' }]}
                        >
                            <Input placeholder="admin@medilink.com" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="currency"
                            label="System Currency"
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Option value="ETB">ETB - Ethiopian Birr</Option>
                                <Option value="USD">USD - US Dollar</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="maintenanceMode" label="Maintenance Mode" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        {settings?.maintenanceMode && (
                            <Form.Item name="maintenanceMessage" label="Maintenance Message">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        )}
                    </Col>
                </Row>
            ),
        },
        {
            key: 'email',
            label: <span><MailOutlined /> Email Service</span>,
            children: (
                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>SMTP Configuration</Title>
                        <Form.Item name={['emailService', 'enabled']} label="Enable Email Service" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['emailService', 'host']} label="SMTP Host">
                            <Input placeholder="smtp.gmail.com" />
                        </Form.Item>
                        <Form.Item name={['emailService', 'port']} label="SMTP Port">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Authentication</Title>
                        <Form.Item name={['emailService', 'auth', 'user']} label="Username / Email">
                            <Input />
                        </Form.Item>
                        <Form.Item name={['emailService', 'auth', 'pass']} label="Password / App Key">
                            <Input.Password />
                        </Form.Item>
                        <Form.Item name={['emailService', 'fromEmail']} label="From Email Address">
                            <Input />
                        </Form.Item>
                        <Form.Item name={['emailService', 'secure']} label="Use Secure Connection (TLS/SSL)" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: 'payment',
            label: <span><DollarOutlined /> Payment Gateways</span>,
            children: (
                <Row gutter={24}>
                    <Col span={12}>
                        <Card title="Chapa (Ethiopia)" size="small" className="premium-card">
                            <Form.Item name={['paymentGateways', 'chapa', 'isActive']} label="Enable Chapa" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item name={['paymentGateways', 'chapa', 'publicKey']} label="Public Key">
                                <Input.Password />
                            </Form.Item>
                            <Form.Item name={['paymentGateways', 'chapa', 'secretKey']} label="Secret Key">
                                <Input.Password />
                            </Form.Item>
                            <Form.Item name={['paymentGateways', 'chapa', 'encryptionKey']} label="Encryption Key">
                                <Input.Password />
                            </Form.Item>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Stripe (International)" size="small" className="premium-card">
                            <Form.Item name={['paymentGateways', 'stripe', 'isActive']} label="Enable Stripe" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item name={['paymentGateways', 'stripe', 'publishableKey']} label="Publishable Key">
                                <Input.Password />
                            </Form.Item>
                            <Form.Item name={['paymentGateways', 'stripe', 'secretKey']} label="Secret Key">
                                <Input.Password />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            )
        },
        {
            key: 'notifications',
            label: <span><BellOutlined /> Notifications</span>,
            children: (
                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>Active Channels</Title>
                        <Form.Item name={['notificationChannels', 'email']} label="Email Notifications" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['notificationChannels', 'sms']} label="SMS Notifications" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['notificationChannels', 'push']} label="In-App / Push Notifications" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Event Triggers</Title>
                        <Form.Item name={['notificationChannels', 'triggers', 'newOrder']} label="Alert on New Order" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['notificationChannels', 'triggers', 'newUser']} label="Alert on New User Registration" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['notificationChannels', 'triggers', 'systemAlert']} label="Alert on System Errors" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: 'security',
            label: <span><SecurityScanOutlined /> Security</span>,
            children: (
                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>Authentication Policy</Title>
                        <Form.Item
                            name={['securityPolicy', 'force2FAAdmins']}
                            label="Force 2FA for Admins"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                        <Form.Item
                            name={['securityPolicy', 'force2FAPharmacies']}
                            label="Force 2FA for Pharmacies"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Session Management</Title>
                        <Form.Item
                            name={['securityPolicy', 'sessionTimeout']}
                            label="Session Timeout (Minutes)"
                        >
                            <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            name={['securityPolicy', 'passwordPolicy']}
                            label="Password Complexity"
                        >
                            <Select>
                                <Option value="standard">Standard (6+ chars)</Option>
                                <Option value="strong">Strong (8+ chars, mixed case, symbols)</Option>
                                <Option value="strict">Strict (12+ chars, rotated monthly)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'history',
            label: <span><HistoryOutlined /> History</span>,
            children: (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">View the Audit Logs page to see a detailed history of configuration changes.</Text>
                    <br />
                    <Button type="link" href="/admin/audit">Go to Audit Logs</Button>
                </div>
            )
        }
    ];

    return (
        <div className="settings-page fade-in">
            <Row justify="center">
                <Col span={24}>
                    <Card
                        title={<Space><SettingOutlined /> System Administrator Configuration</Space>}
                        className="premium-card"
                        extra={
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={() => form.submit()}
                                loading={saving}
                            >
                                Save Changes
                            </Button>
                        }
                    >
                        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                            Manage platform-wide configurations, security policies, and system status.
                        </Text>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={settings}
                        >
                            <Tabs defaultActiveKey="general" items={items} />
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Settings;
