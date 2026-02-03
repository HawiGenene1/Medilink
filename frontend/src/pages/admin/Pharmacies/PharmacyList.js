
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
import api from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PharmacyList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pendingPharmacies, setPendingPharmacies] = useState([]);
    const [activePharmacies, setActivePharmacies] = useState([]);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pendingRes, activeRes] = await Promise.all([
                api.get('/admin/registrations/pending', { params: { role: 'pharmacy_admin' } }),
                api.get('/admin/pharmacies', { params: { status: 'approved' } })
            ]);

            if (pendingRes.data.success) {
                setPendingPharmacies(pendingRes.data.data);
            }
            if (activeRes.data.success) {
                setActivePharmacies(activeRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch pharmacies:', error);
            message.error('Failed to load pharmacy data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const pendingColumns = [
        { title: 'Pharmacy Name', dataIndex: 'pharmacyName', key: 'name', render: text => <b>{text}</b> },
        { title: 'Owner Name', dataIndex: 'ownerName', key: 'owner' },
        { title: 'Submitted Date', dataIndex: 'createdAt', key: 'submitted', render: date => new Date(date).toLocaleDateString() },
        {
            title: 'Doc Status',
            dataIndex: 'status',
            key: 'documents',
            render: status => <Tag color="blue">{status.toUpperCase()}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => navigate(`/admin/pharmacies/${record._id}`)}>Review</Button>
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
                        <div style={{ fontSize: 12, color: '#999' }}>ID: PH-{record._id.substring(record._id.length - 6)}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            render: owner => owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Badge status={status === 'approved' || status === 'Active' ? 'success' : 'error'} text={status.toUpperCase()} />
            )
        },
        { title: 'License', dataIndex: 'licenseNumber', key: 'license' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button size="small" onClick={() => navigate(`/admin/pharmacies/${record._id}`)}>Manage</Button>
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
                                    <Badge count={pendingPharmacies.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                                </span>
                            ),
                            children: (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text type="secondary">Review registration requests from new pharmacies.</Text>
                                    </div>
                                    <Table columns={pendingColumns} dataSource={pendingPharmacies} loading={loading} rowKey="_id" />
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
                                    <Table columns={activeColumns} dataSource={activePharmacies} loading={loading} rowKey="_id" />
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
