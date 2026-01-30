import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Modal, Input, message, Tabs, Descriptions, Divider } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, ShopOutlined, CarOutlined } from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const PendingRegistrations = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [reason, setReason] = useState('');
    // Remove activeTab state as we only show delivery now

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch delivery registrations
            const response = await api.get('/admin/registrations/pending?role=delivery');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            message.error('Failed to fetch pending registrations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async () => {
        if (!reason && actionType === 'reject') {
            message.warning('Please provide a reason for rejection');
            return;
        }

        setLoading(true);
        try {
            const url = `/admin/registrations/${actionType}/${selectedUser._id}`;
            const response = await api.post(url, { reason });

            if (response.data.success) {
                message.success(`User ${actionType}ed successfully`);
                setActionModalVisible(false);
                setDetailsVisible(false);
                setReason('');
                setReason('');
                fetchData();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || `Failed to ${actionType} user`;
            message.error(errorMsg);
            console.error('Approval Error:', error.response?.data || error);
        } finally {
            setLoading(false);
        }
    };

    const showDetails = (user) => {
        setSelectedUser(user);
        setDetailsVisible(true);
    };

    const openActionModal = (user, type) => {
        setSelectedUser(user);
        setActionType(type);
        setActionModalVisible(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => `${record.firstName} ${record.lastName}`
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Vehicle Type',
            dataIndex: 'applicationDetails',
            key: 'vehicleType',
            render: (details) => {
                const type = details?.vehicleDetails?.type || 'N/A';
                let color = 'blue';
                if (type === 'bicycle') color = 'green';
                if (type === 'motorcycle') color = 'orange';
                return <Tag color={color}>{type.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Submitted At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => showDetails(record)} />
                    <Button type="text" style={{ color: 'green' }} icon={<CheckOutlined />} onClick={() => openActionModal(record, 'approve')} />
                    <Button type="text" danger icon={<CloseOutlined />} onClick={() => openActionModal(record, 'reject')} />
                </Space>
            ),
        },
    ];

    const renderApplicationDetails = (user) => {
        if (!user || user.role !== 'delivery') return <Text type="secondary">Invalid application data</Text>;

        const details = user.applicationDetails;
        if (!details) return <Text type="secondary">Incomplete onboarding data</Text>;

        return (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Vehicle Section */}
                <Descriptions title="Vehicle Information" bordered column={2} size="small">
                    <Descriptions.Item label="Vehicle Type">
                        <Tag color="blue">{details.vehicleDetails?.type?.toUpperCase()}</Tag>
                    </Descriptions.Item>
                    {details.vehicleDetails?.type !== 'bicycle' && (
                        <>
                            <Descriptions.Item label="Model">{details.vehicleDetails?.make} {details.vehicleDetails?.model} ({details.vehicleDetails?.year})</Descriptions.Item>
                            <Descriptions.Item label="License Plate">{details.vehicleDetails?.licensePlate}</Descriptions.Item>
                            <Descriptions.Item label="Color">{details.vehicleDetails?.color}</Descriptions.Item>
                        </>
                    )}
                </Descriptions>

                <Descriptions title="Background & Legal" bordered column={2} size="small">
                    <Descriptions.Item label="Consent">
                        {details.backgroundCheck?.consented ? <Tag color="success">Consented</Tag> : <Tag color="error">No Consent</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Consent Date">
                        {details.backgroundCheck?.consentedAt ? new Date(details.backgroundCheck.consentedAt).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                </Descriptions>

                <Descriptions title="Payment & Banking" bordered column={1} size="small">
                    <Descriptions.Item label="Bank">{details.paymentInfo?.bankName}</Descriptions.Item>
                    <Descriptions.Item label="Account Number">{details.paymentInfo?.accountNumber}</Descriptions.Item>
                    <Descriptions.Item label="Payout Preference">
                        <Tag color="purple">{details.paymentInfo?.preference?.toUpperCase()}</Tag>
                    </Descriptions.Item>
                </Descriptions>

                <Descriptions title="Onboarding Progress" bordered column={2} size="small">
                    <Descriptions.Item label="Training Completed">
                        {details.training?.completed ? <Tag color="success">YES</Tag> : <Tag color="warning">NO</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Training Date">
                        {details.training?.completedAt ? new Date(details.training.completedAt).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Inspection Status">
                        <Tag color={details.inspection?.status === 'passed' ? 'success' : 'processing'}>
                            {details.inspection?.status?.toUpperCase()}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>

                {details.documents && (
                    <Card size="small" title="Uploaded Documents">
                        <Space wrap>
                            {details.documents.governmentId && <Button size="small" type="link" onClick={() => window.open(details.documents.governmentId)}>Government ID</Button>}
                            {details.documents.driversLicense && <Button size="small" type="link" onClick={() => window.open(details.documents.driversLicense)}>Driver's License</Button>}
                            {details.documents.vehicleRegistration && <Button size="small" type="link" onClick={() => window.open(details.documents.vehicleRegistration)}>Vehicle Registration</Button>}
                            {details.documents.insuranceProof && <Button size="small" type="link" onClick={() => window.open(details.documents.insuranceProof)}>Insurance Proof</Button>}
                        </Space>
                    </Card>
                )}
            </Space>
        );
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <Card bordered={false} className="shadow-sm">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={2} style={{ margin: 0 }}>Pending Delivery Applications</Title>
                        <Button type="primary" onClick={fetchData}>Refresh List</Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                    />
                </Space>
            </Card>

            {/* Details Drawer/Modal */}
            <Modal
                title="Application Details"
                visible={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setDetailsVisible(false)}>Close</Button>,
                    <Button key="reject" danger onClick={() => openActionModal(selectedUser, 'reject')}>Reject</Button>,
                    <Button key="submit" type="primary" onClick={() => openActionModal(selectedUser, 'approve')}>Approve</Button>,
                ]}
                width={800}
            >
                {selectedUser && (
                    <div>
                        <Descriptions title="User Information" bordered column={2} size="small">
                            <Descriptions.Item label="First Name">{selectedUser.firstName}</Descriptions.Item>
                            <Descriptions.Item label="Last Name">{selectedUser.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{selectedUser.phone}</Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        {renderApplicationDetails(selectedUser)}
                    </div>
                )}
            </Modal>

            {/* Action Modal (Approve/Reject Reason) */}
            <Modal
                title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Application`}
                visible={actionModalVisible}
                onOk={handleAction}
                onCancel={() => setActionModalVisible(false)}
                confirmLoading={loading}
            >
                <Text strong>User: {selectedUser?.firstName} {selectedUser?.lastName}</Text>
                <div style={{ marginTop: '16px' }}>
                    <Text>{actionType === 'approve' ? 'Notes (optional):' : 'Rejection Reason (required):'}</Text>
                    <TextArea
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={actionType === 'approve' ? 'Add any notes for approval...' : 'Explain why the application was rejected...'}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PendingRegistrations;
