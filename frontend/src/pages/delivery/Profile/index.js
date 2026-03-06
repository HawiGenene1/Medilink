import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Descriptions, Button, Row, Col, Tag, Divider, Modal, Form, Input, message, App, Space } from 'antd';
import { UserOutlined, EditOutlined, CarOutlined, PhoneOutlined, CalendarOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { Title, Text } = Typography;

const DeliveryProfile = () => {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const [form] = Form.useForm();
    const [updating, setUpdating] = useState(false);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/delivery/profile');
            if (response.data.success) {
                setProfile(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async (values) => {
        setUpdating(true);
        try {
            await api.put('/users/profile', values);
            message.success('Profile updated successfully!');
            setIsEditModalVisible(false);
            await refreshUser();
            await fetchProfile();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}>My Profile</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card style={{ textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Avatar
                            size={120}
                            icon={<UserOutlined />}
                            src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}?t=${new Date().getTime()}`) : null}
                            style={{ marginBottom: '16px', backgroundColor: '#1E88E5' }}
                        />
                        <Title level={3} style={{ marginBottom: 0 }}>{user?.firstName} {user?.lastName}</Title>
                        <Text type="secondary">{user?.email}</Text>
                        <br />
                        <Tag color="blue" style={{ marginTop: '12px', borderRadius: '4px' }}>VERIFIED PARTNER</Tag>

                        <Divider />

                        <div style={{ textAlign: 'left' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label={<Text type="secondary">Phone</Text>}>{user?.phone || 'Not set'}</Descriptions.Item>
                                <Descriptions.Item label={<Text type="secondary">Joined</Text>}>{formatDate(user?.createdAt)}</Descriptions.Item>
                                <Descriptions.Item label={<Text type="secondary">Deliveries</Text>}>{profile?.totalDeliveries || 0}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            block
                            style={{ marginTop: '24px', height: '40px', borderRadius: '8px' }}
                            onClick={() => {
                                form.setFieldsValue({
                                    firstName: user?.firstName,
                                    lastName: user?.lastName,
                                    phone: user?.phone
                                });
                                setIsEditModalVisible(true);
                            }}
                        >
                            Edit Profile
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card
                        title={<><CarOutlined /> Vehicle Information</>}
                        style={{ borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Row align="middle" gutter={24}>
                            <Col>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: '#f0f5ff',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CarOutlined style={{ fontSize: '32px', color: '#1E88E5' }} />
                                </div>
                            </Col>
                            <Col flex="1">
                                <Title level={4} style={{ margin: 0 }}>
                                    {profile?.vehicleDetails?.make || 'Standard'} {profile?.vehicleDetails?.model || 'Vehicle'}
                                </Title>
                                <Space split={<Divider type="vertical" />}>
                                    <Text type="secondary">{profile?.vehicleDetails?.type?.toUpperCase() || 'DELIVERY'}</Text>
                                    <Text type="secondary">{profile?.vehicleDetails?.licensePlate || 'NO PLATE'}</Text>
                                    <Text style={{ color: '#52c41a' }}>Verified</Text>
                                </Space>
                            </Col>
                        </Row>
                        {profile?.vehicleDetails?.color && (
                            <div style={{ marginTop: '16px' }}>
                                <Tag icon={<BgColorsOutlined />}>{profile.vehicleDetails.color}</Tag>
                                <Tag icon={<CalendarOutlined />}>{profile.vehicleDetails.year || '2022'}</Tag>
                            </div>
                        )}
                    </Card>

                    <Card
                        title="Personal Details"
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Descriptions layout="vertical" bordered size="middle" column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="First Name">{user?.firstName}</Descriptions.Item>
                            <Descriptions.Item label="Last Name">{user?.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email Address">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone Number">{user?.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Emergency Contact">{profile?.personalDetails?.emergencyContact?.name || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            {/* Edit Profile Modal */}
            <Modal
                title="Edit My Profile"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                    style={{ marginTop: '16px' }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="firstName"
                                label="First Name"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="First Name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="lastName"
                                label="Last Name"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Last Name" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                        <Button
                            style={{ marginRight: '8px' }}
                            onClick={() => setIsEditModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={updating}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DeliveryProfile;
