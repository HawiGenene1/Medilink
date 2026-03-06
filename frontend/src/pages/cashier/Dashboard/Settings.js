import React from 'react';
import { Card, Typography, Descriptions, Avatar, Space, Button } from 'antd';
import { UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const CashierSettings = () => {
    const { user } = useAuth();

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={2}>Settings</Title>
            <Card style={{ marginBottom: 24 }}>
                <Space size="large" align="start">
                    <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
                    <div>
                        <Title level={4}>{user?.firstName} {user?.lastName} (Cashier)</Title>
                        <Text type="secondary">{user?.email}</Text>
                        <div style={{ marginTop: 16 }}>
                            <Button icon={<EditOutlined />} style={{ marginRight: 8 }}>Edit Profile</Button>
                            <Button icon={<LockOutlined />}>Change Password</Button>
                        </div>
                    </div>
                </Space>
            </Card>

            <Card title="Account Information">
                <Descriptions column={1} bordered>
                    <Descriptions.Item label="Full Name">{user?.firstName} {user?.lastName}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                    <Descriptions.Item label="Role">{user?.role?.toUpperCase()}</Descriptions.Item>
                    <Descriptions.Item label="Pharmacy ID">{user?.pharmacyId || 'N/A'}</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default CashierSettings;
