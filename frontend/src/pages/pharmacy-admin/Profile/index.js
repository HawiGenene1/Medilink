import React, { useState, useRef } from 'react';
import { Row, Col, Card, Typography, Form, Input, Button, Avatar, List, Tag, Space, App, Divider } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    CameraOutlined,
    EditOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { Title, Text } = Typography;

const PharmacyAdminProfile = () => {
    const { user } = useAuth();
    const { message } = App.useApp();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = 'http://localhost:5000'; // Fallback for dev
        return `${baseUrl}${path}?t=${new Date().getTime()}`;
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setLoading(true);
        try {
            const response = await api.post('/users/profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updatedUser = { ...user, avatar: response.data.avatar };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            message.success('Profile image updated successfully');
            window.location.reload();
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleProfileUpdate = async (values) => {
        setLoading(true);
        try {
            // Support both structured values and single name string
            const nameToSplit = values.firstName || values.name || '';
            const nameParts = nameToSplit.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (values.lastName || ' ');

            await api.put('/users/profile', {
                firstName,
                lastName,
                phone: values.phone
            });
            message.success('Profile updated successfully');
            setEditing(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Update failed:', error);
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Admin Profile</Title>
                <Text type="secondary">Manage your personal information and account security</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card style={{ textAlign: 'center', borderRadius: '16px' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                            <Avatar
                                size={120}
                                icon={<UserOutlined />}
                                src={getAvatarUrl(user?.avatar)}
                                style={{ backgroundColor: '#1890ff', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Button
                                shape="circle"
                                icon={<CameraOutlined />}
                                size="large"
                                style={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: '#1890ff', color: '#fff', border: '2px solid #fff' }}
                                onClick={triggerFileInput}
                                loading={loading}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <Title level={4} style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>{user?.email}</Text>

                        <Tag color="gold" style={{ padding: '4px 12px', borderRadius: '12px' }}>SYSTEM ADMINISTRATOR</Tag>

                        <Divider />

                        <div style={{ textAlign: 'left' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Status</Text>
                                    <Tag color="success">Active</Tag>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Joined</Text>
                                    <Text strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: '16px' }} title={<Space><EditOutlined /> Personal Information</Space>}
                        extra={<Button type={editing ? 'default' : 'primary'} onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Identity'}</Button>}>
                        <Form
                            layout="vertical"
                            onFinish={handleProfileUpdate}
                            initialValues={{
                                firstName: user?.firstName || '',
                                lastName: user?.lastName || '',
                                email: user?.email || '',
                                phone: user?.phone || ''
                            }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                                        <Input disabled={!editing} prefix={<UserOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                                        <Input disabled={!editing} prefix={<UserOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Email Address" name="email">
                                        <Input disabled prefix={<MailOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Phone Number" name="phone">
                                        <Input disabled={!editing} prefix={<PhoneOutlined />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            {editing && (
                                <Button type="primary" htmlType="submit" loading={loading} block style={{ marginTop: '16px' }}>
                                    Save Profile Changes
                                </Button>
                            )}
                        </Form>
                    </Card>

                    <Card style={{ borderRadius: '16px', marginTop: '24px' }} title={<Space><SafetyCertificateOutlined /> Account Security</Space>}>
                        <List>
                            <List.Item extra={<Tag color="success">Verified</Tag>}>
                                <List.Item.Meta title="Email Verification" description="Your email address is verified and secure." />
                            </List.Item>
                            <List.Item extra={<Button type="link" onClick={() => window.location.href = '/pharmacy-admin/settings'}>Manage</Button>}>
                                <List.Item.Meta title="Password" description="Manage your login credentials in settings." />
                            </List.Item>
                        </List>
                    </Card>
                </Col>
            </Row>
        </div >
    );
};

export default PharmacyAdminProfile;
