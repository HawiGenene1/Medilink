
import React, { useState } from 'react';
import {
    Tabs, Card, List, Tag, Button, Typography, Input, Select,
    Modal, Form, Space, Badge, Avatar, Divider, message
} from 'antd';
import {
    MessageOutlined,
    NotificationOutlined,
    SearchOutlined,
    PlusOutlined,
    UserOutlined,
    SendOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Communication = () => {
    const [isComposeVisible, setIsComposeVisible] = useState(false);

    // Mock Messages (Support Inbox)
    const messages = [
        {
            id: 1,
            sender: 'John Doe (User)',
            subject: 'Issue with Order #1234',
            preview: 'I have not received my order yet...',
            status: 'Open',
            time: '10 mins ago',
            type: 'Support'
        },
        {
            id: 2,
            sender: 'Pharmacy A',
            subject: 'License Verification Request',
            preview: 'Attached documents for review...',
            status: 'Pending',
            time: '2 hours ago',
            type: 'Verification'
        },
        {
            id: 3,
            sender: 'System Admin',
            subject: 'Database Maintenance Alert',
            preview: 'Scheduled downtime on Sunday...',
            status: 'Closed',
            time: '1 day ago',
            type: 'System'
        },
    ];

    // Mock Announcements
    const announcements = [
        {
            id: 1,
            title: 'Version 2.0 Update',
            target: 'All Users',
            content: 'We represent the new dashboard features...',
            date: '2024-01-15',
            status: 'Published'
        },
        {
            id: 2,
            title: 'Pharmacy Policy Change',
            target: 'Pharmacy Owners',
            content: 'Updated guidelines for prescription handling...',
            date: '2024-01-10',
            status: 'Draft'
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
                        style={{ cursor: 'pointer', '&:hover': { background: '#fafafa' } }}
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
        <Card bordered={false}>
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
                            extra={<Tag color={item.status === 'Published' ? 'blue' : 'orange'}>{item.status}</Tag>}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                    <Text type="secondary">Target:</Text>
                                    <Tag>{item.target}</Tag>
                                    <Divider type="vertical" />
                                    <Text type="secondary">Date:</Text>
                                    <Text>{item.date}</Text>
                                </Space>
                                <Paragraph ellipsis={{ rows: 2 }}>{item.content}</Paragraph>
                                <Button size="small">Edit / Manage</Button>
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />
        </Card>
    );

    return (
        <div className="communication-page">
            <Title level={2}>Communication Center</Title>

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

            <Modal
                title="Compose Announcement"
                open={isComposeVisible}
                onCancel={() => setIsComposeVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsComposeVisible(false)}>Cancel</Button>,
                    <Button key="draft">Save Draft</Button>,
                    <Button key="send" type="primary" icon={<SendOutlined />} onClick={() => {
                        message.success('Announcement broadcasted successfully!');
                        setIsComposeVisible(false);
                    }}>Broadcast</Button>
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label="Subject">
                        <Input placeholder="Enter announcement title" />
                    </Form.Item>
                    <Form.Item label="Target Audience">
                        <Select defaultValue="all">
                            <Option value="all">All Users</Option>
                            <Option value="customers">Customers Only</Option>
                            <Option value="pharmacies">Pharmacy Owners Only</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Message Content">
                        <TextArea rows={4} placeholder="Type your message here..." />
                    </Form.Item>
                    <Form.Item label="Priority">
                        <Select defaultValue="normal">
                            <Option value="normal">Normal</Option>
                            <Option value="high">High (Push Notification)</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Communication;
