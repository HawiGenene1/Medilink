import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Tooltip } from 'antd';
import { EyeOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const { Title } = Typography;

const DeliveryApplicationList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/delivery/onboarding/admin/applications');
            if (response.data && response.data.success) {
                setApplications(response.data.data);
            } else {
                setApplications([]);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            message.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (text, record) => `${record.userId?.firstName || ''} ${record.userId?.lastName || ''}`.trim() || 'N/A',
        },
        {
            title: 'Email',
            dataIndex: ['userId', 'email'],
            key: 'email',
            render: (email) => email || 'N/A',
        },
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (text, record) => (
                <Space>
                    <CarOutlined />
                    {record.vehicleDetails?.vehicleType || 'N/A'}
                    <span style={{ color: '#8c8c8c', fontSize: '12px' }}>({record.vehicleDetails?.licensePlate || 'N/A'})</span>
                </Space>
            ),
        },
        {
            title: 'Submitted At',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (text) => new Date(text).toLocaleDateString(),
            sorter: (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt),
        },
        {
            title: 'Status',
            dataIndex: 'onboardingStatus',
            key: 'status',
            render: (status) => {
                let color = 'default';
                const statusText = status || 'pending';
                if (statusText === 'approved') color = 'success';
                if (statusText === 'rejected') color = 'error';
                if (statusText === 'pending_review' || statusText === 'pending') color = 'processing';
                return <Tag color={color}>{statusText.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    <Tooltip title="View Details">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/admin/registrations/${record._id}`)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Delivery Applications</Title>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchApplications}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            <Card shadow="none">
                <Table
                    columns={columns}
                    dataSource={applications}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default DeliveryApplicationList;
