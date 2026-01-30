import React, { useState } from 'react';
import { Card, Switch, List, Button, Typography, Row, Col, Form, Input, notification, Divider } from 'antd';
import { BellOutlined, CarOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;

const DeliverySettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Mock user settings
    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        smsAlerts: false,
        autoAccept: false,
        darkMap: false
    });

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        notification.success({ message: 'Settings updated' });
    };

    const handlePasswordChange = (values) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            notification.success({ message: 'Password updated successfully' });
        }, 1000);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2}>Settings</Title>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card title={<><BellOutlined /> Notification Preferences</>} style={{ borderRadius: '12px' }}>
                        <List>
                            <List.Item actions={[<Switch checked={settings.notifications} onChange={() => handleToggle('notifications')} />]}>
                                <List.Item.Meta title="Push Notifications" description="Receive alerts for new orders" />
                            </List.Item>
                            <List.Item actions={[<Switch checked={settings.emailAlerts} onChange={() => handleToggle('emailAlerts')} />]}>
                                <List.Item.Meta title="Email Summaries" description="Daily earning reports" />
                            </List.Item>
                            <List.Item actions={[<Switch checked={settings.smsAlerts} onChange={() => handleToggle('smsAlerts')} />]}>
                                <List.Item.Meta title="SMS Alerts" description="Urgent updates via SMS" />
                            </List.Item>
                        </List>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title={<><CarOutlined /> Delivery Preferences</>} style={{ borderRadius: '12px' }}>
                        <List>
                            <List.Item actions={[<Switch checked={settings.autoAccept} onChange={() => handleToggle('autoAccept')} />]}>
                                <List.Item.Meta title="Auto-Accept Orders" description="Automatically accept orders within 2km" />
                            </List.Item>
                            <List.Item actions={[<Switch checked={settings.darkMap} onChange={() => handleToggle('darkMap')} />]}>
                                <List.Item.Meta title="Dark Mode Map" description="Use dark theme for navigation map" />
                            </List.Item>
                        </List>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title={<><LockOutlined /> Security</>} style={{ borderRadius: '12px' }}>
                        <Form layout="vertical" onFinish={handlePasswordChange}>
                            <Form.Item label="New Password" name="password" rules={[{ required: true, min: 6 }]}>
                                <Input.Password placeholder="Enter new password" />
                            </Form.Item>
                            <Form.Item label="Confirm Password" name="confirm" rules={[{ required: true }]}>
                                <Input.Password placeholder="Confirm new password" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Change Password
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DeliverySettings;
