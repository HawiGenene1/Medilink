
import React, { useState } from 'react';
import {
    Table, Card, Button, Tabs, Tag, Space, Avatar, Descriptions,
    Modal, Input, Badge, Typography, message
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ShopOutlined,
    SearchOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PharmacyList = () => {
    const navigate = useNavigate();
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    // Mock Data for Pending Requests
    const pendingData = [
        { key: '1', name: 'New Age Pharmacy', owner: 'Kebede T.', submitted: '2023-11-20', documents: 'Verified' },
        { key: '2', name: 'Bole Road Meds', owner: 'Almaz B.', submitted: '2023-11-19', documents: 'Missing License' },
    ];

    // Mock Data for Active Pharmacies
    const activeData = Array.from({ length: 15 }).map((_, i) => ({
        key: i + 10,
        name: `Pharmacy ${i}`,
        owner: `Owner ${i}`,
        status: i % 5 === 0 ? 'Suspended' : 'Active',
        orders: Math.floor(Math.random() * 1000),
        rating: (3 + Math.random() * 2).toFixed(1)
    }));

    const pendingColumns = [
        { title: 'Pharmacy Name', dataIndex: 'name', key: 'name', render: text => <b>{text}</b> },
        { title: 'Owner Name', dataIndex: 'owner', key: 'owner' },
        { title: 'Submitted Date', dataIndex: 'submitted', key: 'submitted' },
        {
            title: 'Doc Status',
            dataIndex: 'documents',
            key: 'documents',
            render: status => <Tag color={status === 'Verified' ? 'blue' : 'orange'}>{status}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => navigate(`/admin/pharmacies/${record.key}`)}>Review</Button>
                </Space>
            )
        }
    ];

    const activeColumns = [
        {
            title: 'Pharmacy Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar shape="square" icon={<ShopOutlined />} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>ID: PH-{record.key}</div>
                    </div>
                </Space>
            )
        },
        { title: 'Owner', dataIndex: 'owner', key: 'owner' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Badge status={status === 'Active' ? 'success' : 'error'} text={status} />
            )
        },
        { title: 'Total Orders', dataIndex: 'orders', key: 'orders' },
        { title: 'Rating', dataIndex: 'rating', key: 'rating' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button size="small" onClick={() => navigate(`/admin/pharmacies/${record.key}`)}>Manage</Button>
            )
        }
    ];

    return (
        <div className="pharmacy-list-page">
            <Title level={2}>Pharmacy Management</Title>

            <Card bordered={false}>
                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: (
                                <span>
                                    Pending Requests
                                    <Badge count={pendingData.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                                </span>
                            ),
                            children: (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text type="secondary">Review registration requests from new pharmacies.</Text>
                                    </div>
                                    <Table columns={pendingColumns} dataSource={pendingData} />
                                </>
                            )
                        },
                        {
                            key: '2',
                            label: 'Active Pharmacies',
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <Input prefix={<SearchOutlined />} placeholder="Search pharmacy..." style={{ width: 300 }} />
                                    </div>
                                    <Table columns={activeColumns} dataSource={activeData} />
                                </>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
};

export default PharmacyList;
