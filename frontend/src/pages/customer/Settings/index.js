import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Form, Input, Button, Switch, Avatar, Upload, Space, Divider, Alert, List } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
    EditOutlined,
    CameraOutlined,
    EnvironmentOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    MailOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { App } from 'antd';
import './Settings.css';

const { Title, Text, Paragraph } = Typography;

const Settings = () => {
    const { user } = useAuth();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('security'); // Changed default active tab

    const SecuritySettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Change Password</Title>
            <Paragraph type="secondary">Ensure clinical data security by using a strong password.</Paragraph>
            <Form layout="vertical" style={{ maxWidth: '400px', marginTop: '24px' }}>
                <Form.Item label="Current Password" name="currentPassword">
                    <Input.Password iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
                </Form.Item>
                <Form.Item label="New Password" name="newPassword">
                    <Input.Password iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
                </Form.Item>
                <Form.Item label="Confirm New Password" name="confirmPassword">
                    <Input.Password iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
                </Form.Item>
                <Button type="primary">Update Password</Button>
            </Form>

            <Divider style={{ margin: '40px 0' }} />

            <Title level={4} style={{ color: '#E53935' }}>Two-Factor Authentication</Title>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Secure your account with SMS verification for all clinical orders.</Text>
                <Switch defaultChecked />
            </div>
        </div>
    );

    const NotificationSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Email Notifications</Title>
            <div className="pref-row">
                <Text>Order Status Updates</Text>
                <Switch defaultChecked />
            </div>
            <div className="pref-row">
                <Text>Newsletter & Health Tips</Text>
                <Switch />
            </div>

            <Divider />

            <Title level={4}>Push Notifications</Title>
            <div className="pref-row">
                <Text>Direct messaging from pharmacist</Text>
                <Switch defaultChecked />
            </div>
            <div className="pref-row">
                <Text>Interactive tracking alerts</Text>
                <Switch defaultChecked />
            </div>
        </div>
    );

    const PrivacySettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Privacy Preferences</Title>
            <Paragraph type="secondary">Manage how your medical data and activity is shared.</Paragraph>
            <div className="pref-row">
                <Text>Share interaction data with pharmacists</Text>
                <Switch defaultChecked />
            </div>
            <div className="pref-row">
                <Text>Digital Prescriptions: Auto-share with pharmacies</Text>
                <Switch defaultChecked />
            </div>
            <Divider />
            <Title level={4} style={{ color: '#ff4d4f' }}>Data Management</Title>
            <Button danger>Download My Data (JSON)</Button>
        </div>
    );

    const PreferencesSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>App Preferences</Title>
            <div className="pref-row">
                <Text>Theme</Text>
                <Switch
                    checkedChildren="Dark"
                    unCheckedChildren="Light"
                    defaultChecked={false}
                />
            </div>
            <Divider />
            <Title level={4}>Clinical Preferences</Title>
            <Paragraph type="secondary">Set your default healthcare providers.</Paragraph>
            <Card className="option-card-mini" style={{ marginBottom: '16px' }}>
                <Space>
                    <EnvironmentOutlined style={{ color: '#1E88E5' }} />
                    <Text strong>Kenema Pharmacy No. 4 (Bole)</Text>
                    <Button type="link" size="small">Change Default</Button>
                </Space>
            </Card>
        </div>
    );

    const SupportSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Support & Legal</Title>
            <List
                itemLayout="horizontal"
                dataSource={[
                    { title: 'Help Center', description: 'FAQs and support guides' },
                    { title: 'Terms of Service', description: 'Legal agreement for using MediLink' },
                    { title: 'Privacy Policy', description: 'How we handle your data' },
                ]}
                renderItem={(item) => (
                    <List.Item actions={[<Button type="link" key="view">View</Button>]}>
                        <List.Item.Meta
                            title={item.title}
                            description={item.description}
                        />
                    </List.Item>
                )}
            />
            <Divider />
            <Button danger block>Delete Account</Button>
        </div>
    );

    const tabItems = [
        { key: 'security', label: <span><LockOutlined /> Security</span>, children: <SecuritySettings /> },
        { key: 'notifications', label: <span><BellOutlined /> Notifications</span>, children: <NotificationSettings /> },
        { key: 'privacy', label: <span><SafetyCertificateOutlined /> Privacy</span>, children: <PrivacySettings /> },
        { key: 'preferences', label: <span><EditOutlined /> Preferences</span>, children: <PreferencesSettings /> },
        { key: 'support', label: <span><MailOutlined /> Support</span>, children: <SupportSettings /> },
    ];

    return (
        <div className="settings-page fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <Title level={2}>Account Settings</Title>
                <Text type="secondary">Manage your identity, clinical preferences, and security.</Text>
            </div>

            <Card bordered={false} className="settings-main-card">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabPosition="left"
                    items={tabItems}
                    className="settings-tabs"
                />
            </Card>
        </div>
    );
};

// Use CustomBadge to handle the Camera Icon properly without shadowing AntD's Badge
const CustomBadge = ({ count, children, offset }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
        {children}
        <div style={{ position: 'absolute', right: offset[0], bottom: offset[1], zIndex: 10 }}>
            {count}
        </div>
    </div>
);

export default Settings;
