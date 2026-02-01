import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, Switch, List, Avatar, Button, Space, Modal, Form, Input, message } from 'antd';
import { UserOutlined, BellOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import pharmacyAdminService from '../../../services/pharmacyAdminService';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const PharmacyAdminSettings = () => {
    const { user } = useAuth();
    const [profileModal, setProfileModal] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Local state for toggles to make them immediately responsive
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.settings?.notificationsEnabled ?? true);
    const [complianceEnabled, setComplianceEnabled] = useState(user?.settings?.complianceEnabled ?? true);

    // Update local state when user context changes
    useEffect(() => {
        setNotificationsEnabled(user?.settings?.notificationsEnabled ?? true);
        setComplianceEnabled(user?.settings?.complianceEnabled ?? true);
    }, [user]);

    const handleProfileUpdate = async (values) => {
        setLoading(true);
        try {
            // Split name into firstName and lastName robustly
            const nameParts = values.name.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

            await pharmacyAdminService.updateProfile({
                firstName,
                lastName,
                phone: values.phone
            });

            message.success('Profile updated successfully');
            setProfileModal(false);
            // Reload to refresh context and header
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Update failed:', error);
            message.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (values) => {
        setLoading(true);
        try {
            await pharmacyAdminService.updateProfile({
                password: values.new
            });

            message.success('Password changed successfully');
            setPasswordModal(false);
        } catch (error) {
            console.error('Password change failed:', error);
            message.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (key, checked) => {
        // Update local state immediately for responsive UI
        if (key === 'notificationsEnabled') {
            setNotificationsEnabled(checked);
        } else if (key === 'complianceEnabled') {
            setComplianceEnabled(checked);
        }

        try {
            const response = await pharmacyAdminService.updateAdminSettings({
                [key]: checked
            });

            // Update localStorage for persistence
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            message.success(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} updated`);
        } catch (error) {
            // Revert local state on error
            if (key === 'notificationsEnabled') {
                setNotificationsEnabled(!checked);
            } else if (key === 'complianceEnabled') {
                setComplianceEnabled(!checked);
            }

            console.error('Setting update failed:', error);
            message.error('Failed to update setting');
        }
    };

    const settingsOptions = [
        {
            title: 'Account Settings',
            description: 'Update your profile information and security preferences',
            icon: <UserOutlined />,
            action: <Button onClick={() => setProfileModal(true)}>Edit Profile</Button>
        },
        {
            title: 'Platform Notifications',
            description: 'Manage alerts for registrations and expiring subscriptions',
            icon: <BellOutlined />,
            action: (
                <Switch
                    checked={notificationsEnabled}
                    onChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                />
            )
        },
        {
            title: 'Compliance Policies',
            description: 'Configure system-wide pharmacy compliance rules',
            icon: <GlobalOutlined />,
            action: (
                <Switch
                    checked={complianceEnabled}
                    onChange={(checked) => handleSettingChange('complianceEnabled', checked)}
                />
            )
        },
        {
            title: 'Security',
            description: 'Manage passwords and session handling',
            icon: <LockOutlined />,
            action: <Button onClick={() => setPasswordModal(true)}>Change Password</Button>
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Settings</Title>
                <Text type="secondary">Manage your account and platform-wide configurations</Text>
            </div>

            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <List
                    itemLayout="horizontal"
                    dataSource={settingsOptions}
                    renderItem={item => (
                        <List.Item actions={[item.action]}>
                            <List.Item.Meta
                                avatar={
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 8,
                                        background: '#f0f5ff', color: '#1890ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20
                                    }}>
                                        {item.icon}
                                    </div>
                                }
                                title={<Text strong>{item.title}</Text>}
                                description={item.description}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            {/* Edit Profile Modal */}
            <Modal
                title="Edit Admin Profile"
                open={profileModal}
                onCancel={() => setProfileModal(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    onFinish={handleProfileUpdate}
                    initialValues={{
                        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
                        email: user?.email || '',
                        phone: user?.phone || ''
                    }}
                >
                    <Form.Item label="Full Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
                        <Input placeholder="e.g. John Doe" />
                    </Form.Item>
                    <Form.Item label="Email Address (View Only)" name="email">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: 'Please enter your phone' }]}>
                        <Input placeholder="e.g. +251 912 345 678" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Update Profile
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title="Change Security Password"
                open={passwordModal}
                onCancel={() => setPasswordModal(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" onFinish={handlePasswordChange}>
                    <Form.Item label="Current Password" name="current" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        label="New Password"
                        name="new"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                message: 'Password must include uppercase, lowercase, number, and special character'
                            }
                        ]}
                    >
                        <Input.Password placeholder="Min 8 chars, A-z, 0-9, @#$" />
                    </Form.Item>
                    <Form.Item label="Confirm New Password" name="confirm" dependencies={['new']} rules={[
                        { required: true, message: 'Please confirm your password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('new') === value) return Promise.resolve();
                                return Promise.reject(new Error('Passwords do not match'));
                            },
                        }),
                    ]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} danger block>
                            Change Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PharmacyAdminSettings;
