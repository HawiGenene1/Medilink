
import React from 'react';
import {
    Row, Col, Card, Avatar, Button, Tabs, Descriptions,
    Tag, Timeline, Divider, Typography
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
    UnorderedListOutlined, SafetyCertificateOutlined, HistoryOutlined, KeyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = {
        name: 'Abebe Bikila',
        email: 'abebe@example.com',
        phone: '+251 911 234567',
        role: 'Pharmacy Owner',
        status: 'Active',
        location: 'Addis Ababa, Bole',
        avatar: null
    };

    const ProfileTab = () => (
        <Descriptions title="Personal Information" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{user.phone}</Descriptions.Item>
            <Descriptions.Item label="Location">{user.location}</Descriptions.Item>
            <Descriptions.Item label="Registered Date">2023-01-15</Descriptions.Item>
            <Descriptions.Item label="Last Login">Today, 10:30 AM</Descriptions.Item>
        </Descriptions>
    );

    const ActivityTab = () => (
        <Timeline
            items={[
                { color: 'green', children: 'Logged in from IP 192.168.1.5 (2 mins ago)' },
                { color: 'blue', children: 'Updated pharmacy profile (2 days ago)' },
                { children: 'Changed password (1 month ago)' },
                { children: 'Account created (1 year ago)' },
            ]}
        />
    );

    const SecurityTab = () => (
        <div style={{ maxWidth: 600 }}>
            <h3>Account Security</h3>
            <Card type="inner" title="Login Management">
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col span={16}>
                        <Text strong>Force Password Reset</Text>
                        <br />
                        <Text type="secondary">User will be required to change password on next login.</Text>
                    </Col>
                    <Col><Button>Reset</Button></Col>
                </Row>
                <Divider />
                <Row justify="space-between" align="middle">
                    <Col span={16}>
                        <Text strong>Revoke All Sessions</Text>
                        <br />
                        <Text type="secondary">Log out user from all devices immediately.</Text>
                    </Col>
                    <Col><Button danger>Revoke</Button></Col>
                </Row>
            </Card>
            <br />
            <Card type="inner" title="Account Status">
                <Row justify="space-between" align="middle">
                    <Col span={16}>
                        <Text strong>Disable Account</Text>
                        <br />
                        <Text type="secondary">Prevent user from logging in.</Text>
                    </Col>
                    <Col><Button danger type="primary">Disable</Button></Col>
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
