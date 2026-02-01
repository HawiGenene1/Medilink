import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Table, Tag, Space, Modal, message, Select, Input } from 'antd';
import { ShopOutlined, SafetyCertificateOutlined, StopOutlined, CheckCircleOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import pharmacyAdminService from '../../../services/pharmacyAdminService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PharmacyControl = () => {
    const [loading, setLoading] = useState(true);
    const [pharmacies, setPharmacies] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [actionModal, setActionModal] = useState({ visible: false, pharmacy: null, action: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPharmacies();
    }, [pagination.current, searchQuery === '']);

    const fetchPharmacies = async () => {
        try {
            setLoading(true);
            const response = await pharmacyAdminService.getAllPharmacies({
                page: pagination.current,
                limit: pagination.pageSize,
                search: searchQuery
            });

            setPharmacies(response.data);
            setPagination(prev => ({
                ...prev,
                total: response.pagination.total
            }));
        } catch (error) {
            console.error('Error fetching pharmacies:', error);
            message.error('Failed to load pharmacies');
        } finally {
            setLoading(false);
        }
    };

    const showActionModal = (pharmacy, action) => {
        setActionModal({ visible: true, pharmacy, action });
    };

    const handleStatusChange = async () => {
        if (!actionModal.pharmacy) return;

        try {
            setActionLoading(true);
            const isActivating = actionModal.action === 'activate';

            await pharmacyAdminService.updatePharmacyStatus(
                actionModal.pharmacy._id,
                isActivating,
                reason
            );

            message.success(`Pharmacy ${isActivating ? 'activated' : 'suspended'} successfully`);
            setActionModal({ visible: false, pharmacy: null, action: null });
            setReason('');
            fetchPharmacies();
        } catch (error) {
            console.error('Error updating pharmacy status:', error);
            message.error(error.response?.data?.message || 'Failed to update pharmacy status');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            title: 'Pharmacy',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text, record) => (
                <Space>
                    <ShopOutlined />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Owner',
            dataIndex: 'ownerName',
            key: 'ownerName',
            width: 150,
        },
        {
            title: 'License',
            dataIndex: 'licenseNumber',
            key: 'licenseNumber',
            width: 130,
        },
        {
            title: 'License Status',
            key: 'licenseStatus',
            width: 140,
            render: (_, record) => {
                if (!record.licenseExpiryDate) return <Tag color="default">Unverified</Tag>;
                const expiry = new Date(record.licenseExpiryDate);
                const today = new Date();
                const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) return <Tag color="error">Expired</Tag>;
                if (diffDays <= 180) return <Tag color="warning">Near Expiration</Tag>;
                return <Tag color="success">Valid</Tag>;
            }
        },
        {
            title: 'Account Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 140,
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'error'}>
                    {isActive ? 'ACTIVE' : 'SUSPENDED'}
                </Tag>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 220,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        type={record.isActive ? 'default' : 'primary'}
                        danger={record.isActive}
                        icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => showActionModal(record, record.isActive ? 'suspend' : 'activate')}
                    >
                        {record.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="welcome-section" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <Title level={2} style={{ marginBottom: '8px' }}>Pharmacy Status Control</Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>Manage account activations, suspensions, and verification status</Text>
                </div>
                <Space.Compact style={{ width: '380px', marginBottom: '4px' }}>
                    <Input
                        placeholder="Search by name, owner, or license..."
                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                        allowClear
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={fetchPharmacies}
                        style={{ borderRadius: '8px 0 0 8px' }}
                    />
                    <Button type="primary" onClick={fetchPharmacies} style={{ borderRadius: '0 8px 8px 0' }}>Search</Button>
                </Space.Compact>
            </div>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card>
                        <Table
                            columns={columns}
                            dataSource={pharmacies}
                            loading={loading}
                            pagination={pagination}
                            onChange={(newPagination) => setPagination({ ...pagination, current: newPagination.current })}
                            rowKey="_id"
                            bordered={false}
                            scroll={{ x: 1100 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Action Confirmation Modal */}
            <Modal
                title={`${actionModal.action === 'activate' ? 'Activate' : 'Suspend'} Pharmacy`}
                open={actionModal.visible}
                onOk={handleStatusChange}
                onCancel={() => {
                    setActionModal({ visible: false, pharmacy: null, action: null });
                    setReason('');
                }}
                confirmLoading={actionLoading}
            >
                <p>
                    Are you sure you want to {actionModal.action} <strong>{actionModal.pharmacy?.name}</strong>?
                </p>
                {actionModal.action === 'suspend' && (
                    <div>
                        <Text>Reason for suspension:</Text>
                        <TextArea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Provide a reason for suspending this pharmacy..."
                            style={{ marginTop: 8 }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PharmacyControl;
