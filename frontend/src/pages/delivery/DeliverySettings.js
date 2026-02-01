import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Form, Input, Button, Switch, Avatar, Upload, Space, Divider, Alert, List, Modal, Steps, theme, Tag, App } from 'antd';
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
    CarOutlined,
    InfoCircleOutlined,
    PhoneOutlined,
    StarOutlined,
    QuestionCircleOutlined,
    FileTextOutlined,
    DollarCircleOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../customer/Settings/Settings.css'; // Reuse customer settings styles

const { Title, Text, Paragraph } = Typography;

const DeliverySettings = () => {
    const { user, logout, refreshUser } = useAuth();
    const { theme: appTheme, toggleTheme } = useUI();
    const { message } = App.useApp();
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('security');
    const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwordStep, setPasswordStep] = useState(0); // 0: request, 1: reset
    const [resetToken, setResetToken] = useState('');
    const [vehicleForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Recovery Modal State
    const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
    const [recoveryForm] = Form.useForm();

    // Delete Account State
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteFinal = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/users/profile');
            message.success('Account deleted successfully.');
            logout();
            navigate('/');
        } catch (error) {
            message.error('Failed to delete account.');
        } finally {
            setIsDeleting(false);
            setIsDeleteModalVisible(false);
        }
    };

    const handleDownloadData = () => {
        const dataStr = JSON.stringify(user, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `medilink_delivery_data_${user._id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success("Your data has been downloaded.");
    };

    const handleSetupRecovery = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/profile', values);
            message.success('Account recovery options updated!');
            setRecoveryModalVisible(false);
            await refreshUser();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update recovery');
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleUpdate = async (values) => {
        setLoading(true);
        try {
            await api.put('/delivery/profile', { vehicleDetails: values });
            message.success('Vehicle information updated successfully!');
            setIsVehicleModalVisible(false);
            await refreshUser();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update vehicle info');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/profile', {
                currentPassword: values.currentPassword,
                password: values.newPassword
            });
            message.success('Password updated successfully!');
            setIsPasswordModalVisible(false);
            passwordForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const RecommendedBox = ({ title, children, icon }) => (
        <Card
            className="recommended-feature-card"
            style={{
                borderRadius: '16px',
                border: `1px solid ${token.colorPrimaryBorder}`,
                background: appTheme === 'dark' ? 'rgba(30, 136, 229, 0.05)' : 'rgba(30, 136, 229, 0.02)',
                marginBottom: '24px',
                overflow: 'hidden',
                position: 'relative'
            }}
            bodyStyle={{ padding: '20px' }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: token.colorPrimary,
                color: 'white',
                padding: '2px 12px',
                borderBottomLeftRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
            }}>
                <StarOutlined /> Recommended
            </div>

            <Title level={5} style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon} {title}
            </Title>

            {children}
        </Card>
    );

    const SecuritySettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Security & Recovery</Title>
            <Paragraph type="secondary">Protect your account and earnings with modern security.</Paragraph>

            <List style={{ marginTop: '24px' }}>
                <List.Item actions={[<Button key="reset" onClick={() => { setIsPasswordModalVisible(true); }}>Change Password</Button>]}>
                    <List.Item.Meta
                        avatar={<LockOutlined style={{ fontSize: '20px' }} />}
                        title="Password"
                        description="Last changed: Recently"
                    />
                </List.Item>
                <List.Item actions={[
                    <Button
                        key="recovery"
                        type="primary"
                        ghost
                        onClick={() => {
                            recoveryForm.setFieldsValue({
                                recoveryEmail: user?.recoveryEmail || user?.email,
                                recoveryPhone: user?.recoveryPhone || user?.phone
                            });
                            setRecoveryModalVisible(true);
                        }}
                    >
                        {user?.recoveryEmail ? 'Update Recovery' : 'Set Up Recovery'}
                    </Button>
                ]}>
                    <List.Item.Meta
                        avatar={<SafetyCertificateOutlined style={{ fontSize: '20px' }} />}
                        title="Account Recovery"
                        description={user?.recoveryEmail ? `Active via ${user.recoveryEmail}` : 'Protect your account if you lose access.'}
                    />
                </List.Item>
            </List>
        </div>
    );

    const DeliveryPreferences = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Delivery Preferences</Title>
            <Paragraph type="secondary">Optimize your delivery workflow with our smart features.</Paragraph>

            <RecommendedBox title="Optimized Workflow" icon={<CarOutlined />}>
                <div className="pref-row" style={{ padding: '12px 0' }}>
                    <Space direction="vertical">
                        <Text strong>Auto-Accept Orders</Text>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Automatically accept orders within 3km for faster delivery</Text>
                    </Space>
                    <Switch defaultChecked />
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div className="pref-row" style={{ padding: '12px 0' }}>
                    <Space direction="vertical">
                        <Text strong>Night Shift Mode</Text>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Prefer night-time deliveries between 10 PM - 6 AM</Text>
                    </Space>
                    <Switch />
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <Space direction="vertical">
                            <Text strong>Vehicle Information</Text>
                            <Text type="secondary" style={{ fontSize: '13px' }}>{user?.vehicleInfo?.type?.toUpperCase() || 'Motorcycle'} • {user?.vehicleInfo?.licensePlate || 'ABC-123-ET'}</Text>
                        </Space>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                vehicleForm.setFieldsValue({
                                    type: user?.vehicleInfo?.type || 'motorcycle',
                                    licensePlate: user?.vehicleInfo?.licensePlate || ''
                                });
                                setIsVehicleModalVisible(true);
                            }}
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </RecommendedBox>
        </div>
    );

    const AppearanceSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>App Customization</Title>
            <div className="pref-row">
                <Space direction="vertical">
                    <Text strong>System Theme</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Switch between dark and light modes</Text>
                </Space>
                <Switch
                    checkedChildren="Dark"
                    unCheckedChildren="Light"
                    checked={appTheme === 'dark'}
                    onChange={toggleTheme}
                />
            </div>
            <div className="pref-row">
                <Space direction="vertical">
                    <Text strong>High Contrast Map</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Improved visibility for daytime navigation</Text>
                </Space>
                <Switch defaultChecked />
            </div>
        </div>
    );

    const DataManagementSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Privacy & Data</Title>
            <div className="pref-row">
                <Space direction="vertical">
                    <Text strong>Export Account Data</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Download all your earnings and delivery records</Text>
                </Space>
                <Button onClick={handleDownloadData}>Download JSON</Button>
            </div>

            <Divider />

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 77, 79, 0.05)', border: `1px solid ${token.colorErrorOutline}` }}>
                <Title level={5} type="danger">Danger Zone</Title>
                <Paragraph style={{ fontSize: '13px' }}>Once you delete your account, your delivery history and earned points will be gone forever.</Paragraph>
                <Button danger onClick={() => { setIsDeleteModalVisible(true); setDeleteStep(0); }}>Delete Account</Button>
            </div>
        </div>
    );

    const SupportSettings = () => (
        <div className="settings-section fade-in">
            <Title level={4}>Partner Support</Title>
            <Paragraph type="secondary">Get the help and information you need to succeed.</Paragraph>

            <RecommendedBox title="Resource Center" icon={<QuestionCircleOutlined />}>
                <List
                    itemLayout="horizontal"
                    dataSource={[
                        { title: 'Driver Handbook', desc: 'Guidelines for safe and efficient delivery', icon: <FileTextOutlined style={{ color: '#1E88E5' }} /> },
                        { title: 'Earnings Help', desc: 'Detailed breakdown of payouts and bonuses', icon: <DollarCircleOutlined style={{ color: '#52c41a' }} /> },
                        { title: 'Reporting System', desc: 'Report incidents or order discrepancies', icon: <MessageOutlined style={{ color: '#faad14' }} /> }
                    ]}
                    renderItem={item => (
                        <List.Item
                            actions={[<Button type="link">View</Button>]}
                            style={{ padding: '12px 0' }}
                        >
                            <List.Item.Meta
                                avatar={<div style={{ padding: '8px', background: token.colorFillAlter, borderRadius: '8px' }}>{item.icon}</div>}
                                title={item.title}
                                description={item.desc}
                            />
                        </List.Item>
                    )}
                />
            </RecommendedBox>
        </div>
    );

    const tabItems = [
        { key: 'security', label: <span><LockOutlined /> Security</span>, children: <SecuritySettings /> },
        { key: 'delivery', label: <span><CarOutlined /> Delivery</span>, children: <DeliveryPreferences /> },
        { key: 'appearance', label: <span><EditOutlined /> Appearance</span>, children: <AppearanceSettings /> },
        { key: 'privacy', label: <span><SafetyCertificateOutlined /> Privacy & Data</span>, children: <DataManagementSettings /> },
        { key: 'support', label: <span><InfoCircleOutlined /> Support</span>, children: <SupportSettings /> },
    ];

    return (
        <div className="settings-page fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <Title level={2}>Settings</Title>
                <Text type="secondary">Manage your delivery partner account and preferences.</Text>
            </div>

            <Card bordered={false} className="settings-main-card" style={{ borderRadius: '16px' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabPosition="left"
                    items={tabItems}
                    className="settings-tabs"
                    style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: token.borderRadiusLG
                    }}
                />
            </Card>

            {/* Recovery Modal */}
            <Modal
                title="Update Recovery Options"
                open={recoveryModalVisible}
                onCancel={() => setRecoveryModalVisible(false)}
                footer={null}
            >
                <Form form={recoveryForm} layout="vertical" onFinish={handleSetupRecovery}>
                    <Form.Item name="recoveryEmail" label="Recovery Email" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>
                    <Form.Item name="recoveryPhone" label="Backup Phone">
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Secure Account
                    </Button>
                </Form>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                title="Delete Driver Account"
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
                    items={[{ title: 'Warning' }, { title: 'Confirm' }]}
                />

                {deleteStep === 0 ? (
                    <div className="step-fade-in">
                        <Alert message="Critical Action" type="error" showIcon description="This will permanently end your partnership with MediLink." />
                        <div style={{ textAlign: 'right', marginTop: '24px' }}>
                            <Button onClick={() => setIsDeleteModalVisible(false)} style={{ marginRight: '8px' }}>Cancel</Button>
                            <Button type="primary" danger onClick={() => setDeleteStep(1)}>Proceed</Button>
                        </div>
                    </div>
                ) : (
                    <div className="step-fade-in">
                        <Paragraph>Type <Text strong code>DELETE</Text> to confirm:</Paragraph>
                        <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE" />
                        <div style={{ textAlign: 'right', marginTop: '24px' }}>
                            <Button danger disabled={confirmText !== 'DELETE'} loading={isDeleting} onClick={handleDeleteFinal}>Permanently Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Vehicle Update Modal */}
            <Modal
                title="Update Vehicle Details"
                open={isVehicleModalVisible}
                onCancel={() => setIsVehicleModalVisible(false)}
                footer={null}
                centered
            >
                <Form form={vehicleForm} layout="vertical" onFinish={handleVehicleUpdate}>
                    <Form.Item name="type" label="Vehicle Type" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Motorcycle, Car" />
                    </Form.Item>
                    <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true }]}>
                        <Input placeholder="ABC-123-ET" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Save Changes
                    </Button>
                </Form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                title="Secure Password Update"
                open={isPasswordModalVisible}
                onCancel={() => { setIsPasswordModalVisible(false); }}
                footer={null}
                centered
            >
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordUpdate} className="step-fade-in">
                    <Paragraph type="secondary">Verify your current password to set a new one.</Paragraph>
                    <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
                    </Form.Item>
                    <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Enter new secure password" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="Confirm New Password" rules={[{ required: true }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm new secure password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ marginTop: '8px' }}>
                        Update Password
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default DeliverySettings;
