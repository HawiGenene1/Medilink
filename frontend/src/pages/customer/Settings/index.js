import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Form, Input, Button, Switch, Avatar, Upload, Space, Divider, Alert, List, Modal, Steps } from 'antd';
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
    MailOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
    FrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const { Title, Text, Paragraph } = Typography;

const Settings = () => {
    const { user, logout } = useAuth();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('security'); // Changed default active tab

    // Delete Account State
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteFinal = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/users/profile');
            message.success('Account deleted successfully. We hope to see you again.');
            logout();
            navigate('/');
        } catch (error) {
            console.error('Deletion failed:', error);
            message.error('Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
            setIsDeleteModalVisible(false);
        }
    };

    const nextDeleteStep = () => setDeleteStep(prev => prev + 1);
    const prevDeleteStep = () => setDeleteStep(prev => prev - 1);

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
            <Text type="secondary" style={{ fontSize: '12px' }}>
                Version 1.1.0 (Build 20260120)
            </Text>
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

            {/* Subtle Delete Account Section */}
            <div style={{ marginTop: '64px', borderTop: '1px solid #f0f0f0', paddingTop: '32px', textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    No longer need your account?
                </Text>
                <Button
                    type="link"
                    danger
                    size="small"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => {
                        setIsDeleteModalVisible(true);
                        setDeleteStep(0);
                        setConfirmText('');
                    }}
                >
                    Delete Account
                </Button>
            </div>

            {/* Delete Account multi-step Modal */}
            <Modal
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                        <span>Delete Account</span>
                    </Space>
                }
                open={isDeleteModalVisible}
                onCancel={() => setIsDeleteModalVisible(false)}
                footer={null}
                width={500}
                centered
            >
                <Steps
                    size="small"
                    current={deleteStep}
                    style={{ marginBottom: '24px' }}
                    items={[
                        { title: 'Warning' },
                        { title: 'Impact' },
                        { title: 'Confirm' }
                    ]}
                />

                <div className="delete-flow-content" style={{ minHeight: '180px' }}>
                    {deleteStep === 0 && (
                        <div className="step-fade-in">
                            <Alert
                                message="Permanent Action"
                                description="Deleting your account is irreversible. All your data will be permanently wiped from our secure clinical servers."
                                type="error"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                            <Paragraph>
                                Are you sure you want to proceed? You will lose access to all your prescriptions and order history immediately.
                            </Paragraph>
                            <div style={{ textAlign: 'right', marginTop: '24px' }}>
                                <Button onClick={() => setIsDeleteModalVisible(false)} style={{ marginRight: '8px' }}>
                                    Keep My Account
                                </Button>
                                <Button type="primary" danger onClick={nextDeleteStep}>
                                    I Understand, Proceed
                                </Button>
                            </div>
                        </div>
                    )}

                    {deleteStep === 1 && (
                        <div className="step-fade-in">
                            <Title level={5}>What happens when you delete your account:</Title>
                            <List
                                size="small"
                                dataSource={[
                                    'Access to all active prescriptions will be lost.',
                                    'Order history and digital receipts will be deleted.',
                                    'Saved pharmacies and favorites will be removed.',
                                    'Pharmacists will no longer be able to access your counseling history.'
                                ]}
                                renderItem={item => <List.Item><Text type="secondary">• {item}</Text></List.Item>}
                                style={{ marginBottom: '24px' }}
                            />
                            <div style={{ textAlign: 'right' }}>
                                <Button onClick={prevDeleteStep} style={{ marginRight: '8px' }}>
                                    Back
                                </Button>
                                <Button type="primary" danger onClick={nextDeleteStep}>
                                    Acknowledge & Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {deleteStep === 2 && (
                        <div className="step-fade-in">
                            <Paragraph>
                                To confirm deletion, please type <Text strong code>DELETE</Text> in the field below:
                            </Paragraph>
                            <Input
                                placeholder="Type DELETE to confirm"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                status={confirmText && confirmText !== 'DELETE' ? 'error' : ''}
                                style={{ marginBottom: '24px' }}
                            />
                            <Form.Item label="Reason for leaving (Optional)">
                                <Input.TextArea placeholder="Help us improve..." rows={2} />
                            </Form.Item>
                            <div style={{ textAlign: 'right', marginTop: '12px' }}>
                                <Button onClick={prevDeleteStep} style={{ marginRight: '8px' }}>
                                    Back
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    loading={isDeleting}
                                    disabled={confirmText !== 'DELETE'}
                                    onClick={handleDeleteFinal}
                                >
                                    Permanently Delete Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

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
