import React, { useState, useEffect } from 'react';
import {
    Tabs, Card, List, Tag, Button, Typography, Input, Select,
    Modal, Form, Space, Badge, Avatar, Divider, message, Popconfirm
} from 'antd';
import {
    MessageOutlined,
    NotificationOutlined,
    SearchOutlined,
    PlusOutlined,
    UserOutlined,
    SendOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Communication = () => {
    const [isComposeVisible, setIsComposeVisible] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/announcements');
            if (res.data.success) {
                setAnnouncements(res.data.data);
            }
        } catch (error) {
            message.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreateAnnouncement = async (values) => {
        try {
            const res = await api.post('/admin/announcements', values);
            if (res.data.success) {
                message.success('Announcement broadcasted successfully!');
                setIsComposeVisible(false);
                form.resetFields();
                fetchAnnouncements();
            }
        } catch (error) {
            message.error('Failed to create announcement');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            await api.delete(`/admin/announcements/${id}`);
            message.success('Announcement deleted');
            fetchAnnouncements();
        } catch (error) {
            message.error('Failed to delete announcement');
        }
    };

    // Mock Messages (Support Inbox - TODO: Persistent in later phase)
    const messages = [
        {
            id: 1,
            sender: 'John Doe (User)',
            subject: 'Issue with Order #1234',
            preview: 'I have not received my order yet...',
            status: 'Open',
            time: '10 mins ago',
            type: 'Support'
        }
    ];

    const InboxTab = () => (
        <Card bordered={false} className="inbox-card">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Input placeholder="Search messages..." prefix={<SearchOutlined />} style={{ width: 300 }} />
                <Select defaultValue="All">
                    <Option value="All">All Status</Option>
                    <Option value="Open">Open</Option>
                    <Option value="Closed">Closed</Option>
                </Select>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={messages}
                renderItem={item => (
                    <List.Item
                        actions={[<Button type="link">View Thread</Button>]}
                    >
                        <List.Item.Meta
                            avatar={
                                <Badge dot={item.status === 'Open'}>
                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: item.status === 'Open' ? '#1890ff' : '#ccc' }} />
                                </Badge>
                            }
                            title={
                                <Space>
                                    <Text strong>{item.sender}</Text>
                                    <Tag color={item.status === 'Open' ? 'green' : 'default'}>{item.status}</Tag>
                                </Space>
                            }
                            description={
                                <div>
                                    <Text strong>{item.subject}</Text>
                                    <br />
                                    <Text type="secondary">{item.preview}</Text>
                                    <div style={{ fontSize: 12, marginTop: 4 }}>{item.time}</div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Card>
    );

    const AnnouncementsTab = () => (
        <Card bordered={false} loading={loading}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsComposeVisible(true)}>
                    New Announcement
                </Button>
            </div>

            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={announcements}
                renderItem={item => (
                    <List.Item>
                        <Card
                            type="inner"
                            title={item.title}
                            extra={
                                <Space>
                                    <Tag color={item.status === 'published' ? 'blue' : 'orange'}>{item.status.toUpperCase()}</Tag>
                                    <Popconfirm title="Delete this announcement?" onConfirm={() => handleDeleteAnnouncement(item._id)}>
                                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                    </Popconfirm>
                                </Space>
                            }
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space wrap>
                                    <Text type="secondary">Target:</Text>
                                    <Tag color="cyan">{item.targetAudience.toUpperCase()}</Tag>
                                    <Divider type="vertical" />
                                    <Text type="secondary">Priority:</Text>
                                    <Tag color={item.priority === 'high' ? 'red' : 'default'}>{item.priority.toUpperCase()}</Tag>
                                    <Divider type="vertical" />
                                    <Text type="secondary">Date:</Text>
                                    <Text>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </Space>
                                <Paragraph>{item.content}</Paragraph>
                                <Text type="secondary" style={{ fontSize: 12 }}>Author: {item.author?.email}</Text>
                            </Space>
                        </Card>
                    </List.Item>
                )}
                locale={{ emptyText: 'No announcements found' }}
            />
        </Card>
    );

    return (
        <div className="communication-page">
            <Title level={2} style={{ marginBottom: 24 }}>Platform Communication</Title>

            <Card
                title={<Title level={4}><MessageOutlined /> Recommended Feature: Advanced Engagement</Title>}
                style={{
                    borderRadius: 16,
                    border: '1px solid #e6f7ff',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
            >
                <Paragraph>
                    Manage all system communications, support tickets, and public announcements from this centralized hub.
                </Paragraph>

                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: <span><MessageOutlined /> Inbox & Support</span>,
                            children: <InboxTab />
                        },
                        {
                            key: '2',
                            label: <span><NotificationOutlined /> Announcements</span>,
                            children: <AnnouncementsTab />
                        }
                    ]}
                />
            </Card>

            <Modal
                title="Compose Announcement"
                open={isComposeVisible}
                onCancel={() => setIsComposeVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsComposeVisible(false)}>Cancel</Button>,
                    <Button key="send" type="primary" icon={<SendOutlined />} onClick={() => form.submit()}>Broadcast</Button>
                ]}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateAnnouncement} initialValues={{ targetAudience: 'all', priority: 'normal', status: 'published' }}>
                    <Form.Item label="Subject" name="title" rules={[{ required: true, message: 'Please enter a title' }]}>
                        <Input placeholder="Enter announcement title" />
                    </Form.Item>
                    <Form.Item label="Target Audience" name="targetAudience">
                        <Select>
                            <Option value="all">All Users</Option>
                            <Option value="customers">Customers Only</Option>
                            <Option value="pharmacies">Pharmacy Owners Only</Option>
                            <Option value="delivery">Delivery Partners Only</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Message Content" name="content" rules={[{ required: true, message: 'Please enter content' }]}>
                        <TextArea rows={4} placeholder="Type your message here..." />
                    </Form.Item>
                    <Form.Item label="Priority" name="priority">
                        <Select>
                            <Option value="normal">Normal</Option>
                            <Option value="high">High (Priority)</Option>
                            <Option value="urgent">Urgent</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Communication;
