import React from 'react';
import { Card, Avatar, Typography, Descriptions, Button, Row, Col, Tag, Divider } from 'antd';
import { UserOutlined, EditOutlined, CarOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const DeliveryProfile = () => {
    const { user } = useAuth();

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}>My Profile</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
                        <Avatar
                            size={120}
                            icon={<UserOutlined />}
                            src={user?.avatar}
                            style={{ marginBottom: '16px', backgroundColor: '#1E88E5' }}
                        />
                        <Title level={3}>{user?.firstName} {user?.lastName}</Title>
                        <Text type="secondary">{user?.email}</Text>
                        <br />
                        <Tag color="green" style={{ marginTop: '12px' }}>ACTIVE RIDER</Tag>

                        <Divider />

                        <div style={{ textAlign: 'left' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Phone">{user?.phone || 'Not set'}</Descriptions.Item>
                                <Descriptions.Item label="Joined">Jan 2026</Descriptions.Item>
                                <Descriptions.Item label="Total Deliveries">145</Descriptions.Item>
                                <Descriptions.Item label="Rating">4.8/5.0</Descriptions.Item>
                            </Descriptions>
                        </div>

                        <Button type="primary" icon={<EditOutlined />} block style={{ marginTop: '16px' }}>
                            Edit Profile
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card title="Vehicle Information" style={{ borderRadius: '12px', marginBottom: '24px' }} extra={<Button type="link">Update</Button>}>
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Avatar size={64} icon={<CarOutlined />} style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }} />
                            </Col>
                            <Col>
                                <Title level={4} style={{ margin: 0 }}>Yamaha R3</Title>
                                <Text type="secondary">Motorcycle • Blue • FAST-22</Text>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="Personal Details" style={{ borderRadius: '12px' }}>
                        <Descriptions layout="vertical" bordered>
                            <Descriptions.Item label="Full Name">{user?.firstName} {user?.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone Number">{user?.phone}</Descriptions.Item>
                            <Descriptions.Item label="Date of Birth">15 May 1992</Descriptions.Item>
                            <Descriptions.Item label="Address">456 Fast Lane, Speed City, CA</Descriptions.Item>
                            <Descriptions.Item label="Emergency Contact">Speedy Contact (Peer)</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DeliveryProfile;
