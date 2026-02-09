
import React, { useState } from 'react';
import {
    Tabs, Card, Form, Input, Button, Switch, Select, Upload, message,
    Divider, Space, Typography, Alert, Row, Col
} from 'antd';
import {
    SettingOutlined,
    LockOutlined,
    BellOutlined,
    ToolOutlined,
    UploadOutlined,
    SaveOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
    const [form] = Form.useForm();
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const onFinish = (values) => {
        message.success('System settings updated successfully');
    };

    const GeneralSettings = () => (
        <Form layout="vertical" initialValues={{ appName: 'Medilink', currency: 'ETB', email: 'admin@medilink.com' }}>
            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Form.Item label="Application Name" name="appName">
                        <Input prefix={<SettingOutlined />} />
                    </Form.Item>
                    <Form.Item label="Admin Contact Email" name="email">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Default Currency" name="currency">
                        <Select>
                            <Option value="ETB">Ethiopian Birr (ETB)</Option>
                            <Option value="USD">US Dollar (USD)</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Brand Logo">
                        <Upload>
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item label="Favicon">
                        <Upload>
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>
            <Button type="primary" icon={<SaveOutlined />}>Save Changes</Button>
        </Form>
    );

    const SecuritySettings = () => (
        <Form layout="vertical" initialValues={{ sessionTimeout: 30, passwordPolicy: 'strong' }}>
            <Form.Item label="Force 2FA for Admins">
                <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Force 2FA for Pharmacy Owners">
                <Switch />
            </Form.Item>

            <Divider />

            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Form.Item label="Session Timeout (Minutes)" name="sessionTimeout">
                        <Input type="number" suffix="min" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Password Policy Strength" name="passwordPolicy">
                        <Select>
                            <Option value="standard">Standard (8 chars)</Option>
                            <Option value="strong">Strong (Caps + Symbol + Number)</Option>
                            <Option value="strict">Strict (12+ chars, renewed 90 days)</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
            <Button type="primary" icon={<SaveOutlined />}>Update Security Policy</Button>
        </Form>
    );

    const MaintenanceSettings = () => (
        <div>
            <Alert
                message="Maintenance Mode"
                description="Activating Maintenance Mode will block access for all non-admin users. Use this only for critical updates."
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card bordered={false} style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                <Space size="large" align="center">
                    <Switch
                        checked={maintenanceMode}
                        onChange={setMaintenanceMode}
                        style={{ backgroundColor: maintenanceMode ? '#f5222d' : undefined }}
                    />
                    <div>
                        <Text strong style={{ fontSize: 16 }}>Enable Maintenance Mode</Text>
                        <br />
                        <Text type="secondary">Current Status: {maintenanceMode ? <Text type="danger">ACTIVE</Text> : <Text type="success">INACTIVE</Text>}</Text>
                    </div>
                </Space>
            </Card>

            <Divider />

            <Form layout="vertical">
                <Form.Item label="Maintenance Message">
                    <Input.TextArea rows={3} defaultValue="We are currently undergoing scheduled maintenance. Please check back later." />
                </Form.Item>
                <Button danger type="primary">Save Maintenance Settings</Button>
            </Form>
        </div>
    );

    return (
        <div className="settings-page">
            <Title level={2}>System Configuration</Title>

            <Card>
                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: <span><SettingOutlined /> General</span>,
                            children: <GeneralSettings />
                        },
                        {
                            key: '2',
                            label: <span><LockOutlined /> Security & Auth</span>,
                            children: <SecuritySettings />
                        },
                        {
                            key: '3',
                            label: <span><ToolOutlined /> Maintenance</span>,
                            children: <MaintenanceSettings />
                        }
                    ]}
                />
            </Card>
        </div>
    );
};

export default Settings;
