
import React, { useState } from 'react';
import {
    Row, Col, Card, Avatar, Button, Tabs, Descriptions,
    Tag, Timeline, Divider, Typography, message, Alert,
    Modal, Input
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
    UnorderedListOutlined, SafetyCertificateOutlined, HistoryOutlined, KeyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const { Title, Text } = Typography;

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users/${id}`);
            if (response.data.success) {
                const userData = response.data.data;
                setUser({
                    name: `${userData.firstName} ${userData.lastName}`,
                    email: userData.email,
                    phone: userData.phone || 'N/A',
                    role: userData.role.toUpperCase(),
                    status: userData.status.toUpperCase(),
                    location: userData.address ? `${userData.address.city}, ${userData.address.state}` : 'N/A',
                    avatar: userData.avatar,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin
                });
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            message.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUser();
    }, [id]);

    if (loading) return <Card loading />;
    if (!user) return <Alert message="User not found" type="error" />;

    const ProfileTab = () => (
        <Descriptions title="Personal Information" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{user.phone}</Descriptions.Item>
            <Descriptions.Item label="Location">{user.location}</Descriptions.Item>
            <Descriptions.Item label="Registered Date">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Last Login">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</Descriptions.Item>
        </Descriptions>
    );

    const toggleStatus = async () => {
        const action = user.isActive !== false ? 'disable' : 'enable';
        try {
            const res = await api.patch(`/admin/users/${id}/${action}`);
            if (res.data.success) {
                message.success(`User ${action}d successfully`);
                fetchUser();
            }
        } catch (error) {
            message.error(error.response?.data?.message || `Failed to ${action} user`);
        }
    };

    const handleResetPassword = () => {
        Modal.confirm({
            title: 'Reset Password',
            content: (
                <div>
                    <p>Enter a temporary password for {user.name}.</p>
                    <Input.Password id="detail-temp-password" placeholder="Min 6 characters" />
                </div>
            ),
            onOk: async () => {
                const newPassword = document.getElementById('detail-temp-password')?.value;
                if (!newPassword || newPassword.length < 6) {
                    message.error('Password must be at least 6 characters');
                    return Promise.reject();
                }
                try {
                    const res = await api.patch(`/admin/users/${id}/reset-password`, { newPassword });
                    if (res.data.success) {
                        message.success('Password reset successfully');
                    }
                } catch (error) {
                    message.error(error.response?.data?.message || 'Failed to reset password');
                }
            }
        });
    };

    const ActivityTab = () => (
        <Timeline
            items={[
                { color: 'blue', children: `Registered on ${new Date(user.createdAt).toLocaleDateString()}` },
                { color: user.isActive !== false ? 'green' : 'red', children: `Account is currently ${user.isActive !== false ? 'Active' : 'Disabled'}` },
                user.lastLogin && { children: `Last login on ${new Date(user.lastLogin).toLocaleString()}` },
            ].filter(Boolean)}
        />
    );

    const SecurityTab = () => (
        <div style={{ maxWidth: 600 }}>
            <Title level={4}>Account Security & Policy</Title>
            <Card type="inner" title="Access Control" className="shadow-sm">
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col span={16}>
                        <Text strong>Password Management</Text>
                        <br />
                        <Text type="secondary">Reset password and enforce change on next login.</Text>
                    </Col>
                    <Col>
                        <Button
                            icon={<KeyOutlined />}
                            onClick={handleResetPassword}
                        >
                            Reset Password
                        </Button>
                    </Col>
                </Row>
                <Divider />
                <Row justify="space-between" align="middle">
                    <Col span={16}>
                        <Text strong>Account Status</Text>
                        <br />
                        <Text type="secondary">
                            {user.isActive !== false
                                ? 'Currently active. Disabling prevents all access.'
                                : 'Currently disabled. Enabling restores full access.'}
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            danger={user.isActive !== false}
                            type="primary"
                            onClick={toggleStatus}
                        >
                            {user.isActive !== false ? 'Disable Account' : 'Enable Account'}
                        </Button>
                    </Col>
                </Row>
            </Card>
        </div>
    );

    const items = [
        { key: '1', label: <span><UnorderedListOutlined />Profile</span>, children: <ProfileTab /> },
        { key: '2', label: <span><HistoryOutlined />Activity</span>, children: <ActivityTab /> },
        { key: '3', label: <span><SafetyCertificateOutlined />Security</span>, children: <SecurityTab /> },
    ];

    return (
        <div className="user-details-page">
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back to Users</Button>

            <Row gutter={24}>
                <Col xs={24} lg={7}>
                    <Card bordered={false} style={{ textAlign: 'center' }}>
                        <Avatar size={100} icon={<UserOutlined />} src={user.avatar} style={{ marginBottom: 16, backgroundColor: '#87d068' }} />
                        <Title level={4} style={{ marginBottom: 4 }}>{user.name}</Title>
                        <Text type="secondary">{user.role}</Text>
                        <br />
                        <Tag color="success" style={{ marginTop: 8 }}>{user.status}</Tag>

                        <Divider />

                        <div style={{ textAlign: 'left' }}>
                            <p><MailOutlined /> {user.email}</p>
                            <p><PhoneOutlined /> {user.phone}</p>
                            <p><EnvironmentOutlined /> {user.location}</p>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={17}>
                    <Card bordered={false}>
                        <Tabs defaultActiveKey="1" items={items} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserDetails;
