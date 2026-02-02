
import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Avatar, Button, Tabs, Descriptions,
    Tag, Timeline, Divider, Typography, Modal, Input, message, App as AntdApp
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
    UnorderedListOutlined, SafetyCertificateOutlined, HistoryOutlined,
    LockOutlined, LogoutOutlined, StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import adminService from '../../../services/api/admin';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { message, modal } = AntdApp.useApp();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUserById(id);
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            message.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchUser();
    }, [id]);

    const handleStatusToggle = () => {
        const isCurrentlyActive = user?.isActive;
        const actionName = isCurrentlyActive ? 'Disable' : 'Enable';

        if (isCurrentlyActive) {
            let reason = '';
            modal.confirm({
                title: 'Disable Account',
                content: (
                    <div style={{ marginTop: 16 }}>
                        <Text>Please provide a reason for disabling this account:</Text>
                        <TextArea
                            rows={4}
                            style={{ marginTop: 8 }}
                            onChange={(e) => reason = e.target.value}
                            placeholder="Violation of terms, security risk, etc."
                        />
                    </div>
                ),
                onOk: async () => {
                    if (!reason) {
                        message.warning('Reason is required to disable account');
                        return Promise.reject();
                    }
                    try {
                        setActionLoading(true);
                        await adminService.disableUser(id, reason);
                        message.success('Account disabled successfully');
                        fetchUser();
                    } catch (error) {
                        message.error('Failed to disable account');
                    } finally {
                        setActionLoading(false);
                    }
                }
            });
        } else {
            modal.confirm({
                title: 'Enable Account',
                content: 'Are you sure you want to re-enable this account?',
                onOk: async () => {
                    try {
                        setActionLoading(true);
                        await adminService.enableUser(id);
                        message.success('Account enabled successfully');
                        fetchUser();
                    } catch (error) {
                        message.error('Failed to enable account');
                    } finally {
                        setActionLoading(false);
                    }
                }
            });
        }
    };

    const handleResetPassword = () => {
        modal.confirm({
            title: 'Reset Password',
            content: 'This will generate a temporary password and send it to the user. Proceed?',
            okText: 'Reset',
            onOk: async () => {
                try {
                    setActionLoading(true);
                    await adminService.resetPassword(id);
                    message.success('Temporary password sent to user email');
                } catch (error) {
                    message.error('Failed to reset password');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleRevokeSessions = () => {
        modal.confirm({
            title: 'Revoke Sessions',
            content: 'This will force the user to log out from all devices. Proceed?',
            okText: 'Revoke',
            okType: 'danger',
            onOk: async () => {
                try {
                    setActionLoading(true);
                    await adminService.revokeSessions(id);
                    message.success('All sessions have been revoked');
                } catch (error) {
                    message.error('Failed to revoke sessions');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    if (loading) return <Card loading={true} />;
    if (!user) return <div style={{ textAlign: 'center', padding: 50 }}>User not found</div>;

    const userData = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || 'N/A',
        role: user.role,
        status: user.isActive ? 'Active' : 'Disabled',
        location: user.city || 'N/A',
        avatar: user.profileImage,
        createdAt: new Date(user.createdAt).toLocaleDateString(),
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
    };

    const items = [
        {
            key: '1',
            label: <span><UnorderedListOutlined />Profile</span>,
            children: (
                <Descriptions title="Personal Information" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Full Name">{userData.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone Number">{userData.phone}</Descriptions.Item>
                    <Descriptions.Item label="Location">{userData.location}</Descriptions.Item>
                    <Descriptions.Item label="Registered Date">{userData.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="Last Login">{userData.lastLogin}</Descriptions.Item>
                </Descriptions>
            )
        },
        {
            key: '2',
            label: <span><HistoryOutlined />Activity</span>,
            children: (
                <Timeline
                    items={[
                        { color: 'green', children: 'Latest login session (Verified)' },
                        { color: 'blue', children: 'Profile update detected' },
                        { children: 'Security baseline verified' },
                        { children: `Account created on ${userData.createdAt}` },
                    ]}
                />
            )
        },
        {
            key: '3',
            label: <span><SafetyCertificateOutlined />Security</span>,
            children: (
                <div style={{ maxWidth: 600 }}>
                    <Card type="inner" title="Access Control" style={{ marginBottom: 16 }}>
                        <Row justify="space-between" align="middle">
                            <Col span={18}>
                                <Text strong>Force Password Reset</Text><br />
                                <Text type="secondary">Sends a temporary password to ${userData.email}</Text>
                            </Col>
                            <Col><Button icon={<LockOutlined />} onClick={handleResetPassword} loading={actionLoading}>Reset</Button></Col>
                        </Row>
                        <Divider />
                        <Row justify="space-between" align="middle">
                            <Col span={18}>
                                <Text strong>Revoke All Sessions</Text><br />
                                <Text type="secondary">Immediately disconnect the user from all devices.</Text>
                            </Col>
                            <Col><Button danger icon={<LogoutOutlined />} onClick={handleRevokeSessions} loading={actionLoading}>Revoke</Button></Col>
                        </Row>
                    </Card>
                    <Card type="inner" title="Account Lifecycle" style={{ border: '1px solid #ffccc7' }}>
                        <Row justify="space-between" align="middle">
                            <Col span={18}>
                                <Text strong>{user.isActive ? 'Disable Account' : 'Enable Account'}</Text><br />
                                <Text type="secondary">{user.isActive ? 'Prevent the user from accessing the platform.' : 'Restore user access to the platform.'}</Text>
                            </Col>
                            <Col>
                                <Button
                                    danger={user.isActive}
                                    type={user.isActive ? 'default' : 'primary'}
                                    icon={user.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                                    onClick={handleStatusToggle}
                                    loading={actionLoading}
                                >
                                    {user.isActive ? 'Disable' : 'Enable'}
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </div>
            )
        },
    ];

    return (
        <div className="user-details-page fade-in" style={{ padding: '24px' }}>
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back to Directory</Button>

            <Row gutter={24}>
                <Col xs={24} lg={7}>
                    <Card bordered={false} style={{ textAlign: 'center' }} className="premium-card">
                        <Avatar size={100} icon={<UserOutlined />} src={userData.avatar} style={{ marginBottom: 16, backgroundColor: '#1E88E5' }} />
                        <Title level={4} style={{ marginBottom: 4 }}>{userData.name}</Title>
                        <Tag color="blue">{userData.role.replace('_', ' ').toUpperCase()}</Tag>
                        <Divider />
                        <div style={{ textAlign: 'left' }}>
                            <p><MailOutlined style={{ marginRight: 8 }} /> {userData.email}</p>
                            <p><PhoneOutlined style={{ marginRight: 8 }} /> {userData.phone}</p>
                            <p><EnvironmentOutlined style={{ marginRight: 8 }} /> {userData.location}</p>
                        </div>
                        <Tag color={user.isActive ? "success" : "error"} style={{ width: '100%', marginTop: 16, padding: '4px 0', textAlign: 'center' }}>
                            {user.isActive ? 'ACTIVE ACCOUNT' : 'DISABLED ACCOUNT'}
                        </Tag>
                    </Card>
                </Col>
                <Col xs={24} lg={17}>
                    <Card bordered={false} className="premium-card">
                        <Tabs defaultActiveKey="1" items={items} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserDetails;
