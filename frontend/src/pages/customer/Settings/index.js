import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Form, Input, Button, Switch, Avatar, Upload, Space, Divider, Alert } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
    EditOutlined,
    CameraOutlined,
    EnvironmentOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone
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
    const [activeTab, setActiveTab] = useState('profile');

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/profile', values);
            message.success('Profile updated successfully');
        } catch (error) {
            console.error('Update failed:', error);
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const ProfileSettings = () => (
        <div className="settings-section fade-in">
            <div className="avatar-upload-wrapper">
                <CustomBadge count={<Button size="small" shape="circle" icon={<CameraOutlined />} className="cam-btn" />} offset={[-10, 110]}>
                    <Avatar size={120} icon={<UserOutlined />} src={user?.avatar ? `http://localhost:5000${user.avatar}` : null} className="profile-avatar-large" />
                </CustomBadge>
                <div className="avatar-info">
                    <Title level={4} style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</Title>
                    <Text type="secondary">Customer</Text>
                </div>
            </div>

            <Divider />

            <Form
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                    phone: user?.phone || ''
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="First Name" name="firstName">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Last Name" name="lastName">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Email Address" name="email">
                    <Input disabled />
                </Form.Item>
                <Form.Item label="Phone Number" name="phone">
                    <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>Save Profile Changes</Button>
            </Form>
        </div>
    );

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

    const ClinicalSettings = () => (
        <div className="settings-section fade-in">
            <Alert
                message="Pharmacist Information"
                description="These preferences help pharmacists provide better counseling for your specific needs."
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
            />
            <Title level={4}>Primary Pharmacy</Title>
            <Paragraph type="secondary">Set a default pharmacy for faster checkout.</Paragraph>
            <Card className="option-card-mini">
                <Space>
                    <EnvironmentOutlined style={{ color: '#1E88E5' }} />
                    <Text strong>Kenema Pharmacy No. 4 (Bole)</Text>
                    <Button type="link" size="small">Change</Button>
                </Space>
            </Card>

            <Divider style={{ margin: '32px 0' }} />

            <Title level={4}>Digital Prescriptions</Title>
            <div className="pref-row">
                <div>
                    <Text strong>Auto-share prescriptions</Text><br />
                    <Text type="secondary" style={{ fontSize: '13px' }}>Allow pharmacies to access your verified Rx history.</Text>
                </div>
                <Switch />
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

    const tabItems = [
        { key: 'profile', label: <span><UserOutlined /> Account</span>, children: <ProfileSettings /> },
        { key: 'security', label: <span><LockOutlined /> Security</span>, children: <SecuritySettings /> },
        { key: 'clinical', label: <span><SafetyCertificateOutlined /> Clinical</span>, children: <ClinicalSettings /> },
        { key: 'notifications', label: <span><BellOutlined /> Privacy</span>, children: <NotificationSettings /> },
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
