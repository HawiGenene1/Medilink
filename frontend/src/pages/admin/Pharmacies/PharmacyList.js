import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Card, Button, Tabs, Tag, Space, Avatar, Badge, Typography, message, Input
} from 'antd';
import {
    ShopOutlined,
    SearchOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;

const PharmacyList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activePharmacies, setActivePharmacies] = useState([]);
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchPending = async () => {
        try {
            const response = await adminService.getPendingRegistrations();
            if (response.success) {
                // Filter for pharmacy_admin role
                const pending = response.data.filter(u => u.role === 'pharmacy_admin');
                setPendingRegistrations(pending.map(u => ({
                    key: u._id,
                    id: u._id,
                    name: u.applicationDetails?.name || 'N/A',
                    owner: `${u.firstName} ${u.lastName}`,
                    email: u.email,
                    submitted: new Date(u.createdAt).toLocaleDateString(),
                    documents: 'Uploaded' // Placeholder
                })));
            }
        } catch (error) {
            console.error('Error fetching pending:', error);
        }
    };

    const fetchActive = useCallback(async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = await adminService.getAllPharmacies({
                page,
                limit: 10,
                search,
                status: 'active'
            });

            if (response.success) {
                setActivePharmacies(response.data.map(p => ({
                    key: p._id,
                    id: p._id,
                    name: p.name,
                    owner: p.ownerName || 'N/A',
                    email: p.email,
                    license: p.licenseNumber,
                    status: p.isActive ? 'Active' : 'Suspended',
                    orders: p.totalOrders || 0,
                    rating: p.rating || 0
                })));
                setPagination({
                    current: response.currentPage,
                    pageSize: 10,
                    total: response.count
                });
            }
        } catch (error) {
            console.error('Error fetching active pharmacies:', error);
            message.error('Failed to load pharmacies');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPending();
        fetchActive();
    }, [fetchActive]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        if (value.length > 2 || value.length === 0) {
            fetchActive(1, value);
        }
    };

    const pendingColumns = [
        { title: 'Pharmacy Name', dataIndex: 'name', key: 'name', render: text => <b>{text}</b> },
        { title: 'Owner Name', dataIndex: 'owner', key: 'owner' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Submitted Date', dataIndex: 'submitted', key: 'submitted' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => navigate(`/admin/registrations/pending`)}>Review</Button>
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
                        <div style={{ fontSize: 12, color: '#999' }}>Lic: {record.license}</div>
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
        { title: 'Rating', dataIndex: 'rating', key: 'rating' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button size="small" onClick={() => navigate(`/admin/pharmacies/${record.key}`)}>Details</Button>
            )
        }
    ];

    return (
        <div className="pharmacy-list-page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ marginBottom: 0 }}>Pharmacy Management</Title>
                <Button icon={<ReloadOutlined />} onClick={() => { fetchActive(); fetchPending(); }}>Refresh</Button>
            </div>

            <Card bordered={false} className="premium-card">
                <Tabs
                    defaultActiveKey="2"
                    items={[
                        {
                            key: '1',
                            label: (
                                <span>
                                    Pending Requests
                                    <Badge count={pendingRegistrations.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                                </span>
                            ),
                            children: (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text type="secondary">Review registration requests from new pharmacies.</Text>
                                    </div>
                                    <Table columns={pendingColumns} dataSource={pendingRegistrations} loading={loading} pagination={false} />
                                </>
                            )
                        },
                        {
                            key: '2',
                            label: 'Active Pharmacies',
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <Input
                                            prefix={<SearchOutlined />}
                                            placeholder="Search by name, owner, or license..."
                                            style={{ width: 300 }}
                                            value={searchText}
                                            onChange={handleSearch}
                                            allowClear
                                        />
                                    </div>
                                    <Table
                                        columns={activeColumns}
                                        dataSource={activePharmacies}
                                        loading={loading}
                                        pagination={{
                                            ...pagination,
                                            onChange: (page) => fetchActive(page, searchText)
                                        }}
                                    />
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
