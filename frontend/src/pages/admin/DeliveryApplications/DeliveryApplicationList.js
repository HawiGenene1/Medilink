import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Tooltip } from 'antd';
import { EyeOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const DeliveryApplicationList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchApplications = async () => {
        setLoading(true);
        try {
            // Note: In a real app, use a configured axios instance with interceptors for token
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.get('http://localhost:5000/api/delivery/admin/applications', config);
            setApplications(response.data);
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
            render: (text, record) => `${record.personalInfo.firstName} ${record.personalInfo.lastName}`,
        },
        {
            title: 'Email',
            dataIndex: ['personalInfo', 'email'],
            key: 'email',
        },
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (text, record) => (
                <Space>
                    <CarOutlined />
                    {record.vehicleInfo.vehicleType}
                    <span style={{ color: '#8c8c8c', fontSize: '12px' }}>({record.vehicleInfo.licensePlate})</span>
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
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'approved') color = 'success';
                if (status === 'rejected') color = 'error';
                if (status === 'pending') color = 'processing';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
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
                            onClick={() => navigate(`/admin/delivery-applications/${record._id}`)}
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
