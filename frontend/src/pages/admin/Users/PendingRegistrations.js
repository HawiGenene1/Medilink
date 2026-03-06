import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Modal, Input, message, Tabs, Descriptions, Divider } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, ShopOutlined, CarOutlined } from '@ant-design/icons';
import api, { BASE_URL } from '../../../services/api';

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
    const [activeTab, setActiveTab] = useState('delivery'); // 'delivery' or 'pharmacy_admin'

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/ admin / registrations / pending`, { params: { role: activeTab } });
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
    }, [activeTab]);

    const handleAction = async () => {
        if (!reason && actionType === 'reject') {
            message.warning('Please provide a reason for rejection');
            return;
        }

        setLoading(true);
        try {
            const url = `/ admin / registrations / ${selectedUser._id}/${actionType}`;
            const response = await api.post(url, { reason });

            if (response.data.success) {
                message.success(`User ${actionType}ed successfully`);
                setActionModalVisible(false);
                setDetailsVisible(false);
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

    const deliveryColumns = [
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
                const type = details?.vehicleDetails?.vehicleType || 'N/A';
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

    const pharmacyColumns = [
        {
            title: 'Pharmacy Name',
            dataIndex: 'applicationDetails',
            key: 'pharmacyName',
            render: (details) => details?.name || details?.pharmacyName || 'N/A'
        },
        {
            title: 'Owner',
            key: 'owner',
            render: (_, record) => record.applicationDetails?.ownerName || `${record.firstName} ${record.lastName}`
        },
        {
            title: 'License Number',
            dataIndex: 'applicationDetails',
            key: 'license',
            render: (details) => details?.licenseNumber || 'N/A'
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
        if (!user) return <Text type="secondary">No application data selected</Text>;

        const details = user.applicationDetails;
        if (!details) return <Text type="secondary">Details pending completion by user</Text>;

        if (user.role === 'delivery') {
            return (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Descriptions title="Vehicle Information" bordered column={2} size="small">
                        <Descriptions.Item label="Vehicle Type">
                            <Tag color="blue">{details.vehicleDetails?.vehicleType?.toUpperCase() || 'N/A'}</Tag>
                        </Descriptions.Item>
                        {details.vehicleDetails?.vehicleType !== 'bicycle' && (
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

                    {details.documents && (
                        <Card size="small" title="Uploaded Documents">
                            <Space wrap>
                                {details.documents.governmentId && <Button size="small" type="link">Government ID</Button>}
                                {details.documents.driversLicense && <Button size="small" type="link">Driver's License</Button>}
                                {details.documents.vehicleRegistration && <Button size="small" type="link">Vehicle Registration</Button>}
                                {details.documents.insuranceProof && <Button size="small" type="link">Insurance Proof</Button>}
                            </Space>
                        </Card>
                    )}
                </Space>
            );
        } else if (user.role === 'pharmacy_admin' || user.role === 'pharmacy_owner') {
            const getZip = (addr) => addr?.zipCode || addr?.postalCode || 'N/A';
            return (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Descriptions title="Pharmacy Information" bordered column={1} size="small">
                        <Descriptions.Item label="Pharmacy Name">{details.name || details.pharmacyName}</Descriptions.Item>
                        <Descriptions.Item label="Pharmacy Email">{details.email}</Descriptions.Item>
                        <Descriptions.Item label="Pharmacy Phone">{details.phone}</Descriptions.Item>
                        <Descriptions.Item label="Business License">{details.licenseNumber}</Descriptions.Item>
                        <Descriptions.Item label="Address">
                            {details.address ? `${details.address.street || ''}, ${details.address.city || ''}, ${details.address.state || ''} ${getZip(details.address)}, ${details.address.country || ''}` : 'N/A'}
                        </Descriptions.Item>
                        {details.tinNumber && <Descriptions.Item label="TIN Number">{details.tinNumber}</Descriptions.Item>}
                    </Descriptions>

                    <Card size="small" title="Registration Documents">
                        <Space wrap>
                            {details.documents && details.documents.length > 0 ? (
                                details.documents.map((doc, index) => (
                                    <Button
                                        key={index}
                                        type="link"
                                        onClick={() => {
                                            const url = typeof doc === 'string' ? doc : doc.url;
                                            const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
                                            window.open(absoluteUrl, '_blank');
                                        }}
                                    >
                                        View {typeof doc === 'string' ? 'Document' : doc.name}
                                    </Button>
                                ))
                            ) : (
                                <>
                                    {details.licenseFile && (
                                        <Button type="link" onClick={() => window.open(details.licenseFile.startsWith('http') ? details.licenseFile : `${BASE_URL}${details.licenseFile}`, '_blank')}>View Business License (PDF)</Button>
                                    )}
                                    {details.licenseDocument && (
                                        <Button type="link" onClick={() => window.open(details.licenseDocument.startsWith('http') ? details.licenseDocument : `${BASE_URL}${details.licenseDocument}`, '_blank')}>View License</Button>
                                    )}
                                    {details.tinDocument && (
                                        <Button type="link" onClick={() => window.open(details.tinDocument.startsWith('http') ? details.tinDocument : `${BASE_URL}${details.tinDocument}`, '_blank')}>View TIN Doc</Button>
                                    )}
                                </>
                            )}
                        </Space>
                    </Card>
                </Space>
            );
        }

        return <Text type="secondary">Invalid application role</Text>;
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <Card bordered={false} className="shadow-sm">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={2} style={{ margin: 0 }}>Registration Approvals</Title>
                        <Button type="primary" onClick={fetchData}>Refresh List</Button>
                    </div>

                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane
                            tab={<span><CarOutlined />Delivery Partners</span>}
                            key="delivery"
                        >
                            <Table
                                columns={deliveryColumns}
                                dataSource={data}
                                loading={loading}
                                rowKey="_id"
                                pagination={{ pageSize: 10 }}
                            />
                        </TabPane>
                        <TabPane
                            tab={<span><ShopOutlined />Pharmacies</span>}
                            key="pharmacy_admin"
                        >
                            <Table
                                columns={pharmacyColumns}
                                dataSource={data}
                                loading={loading}
                                rowKey="_id"
                                pagination={{ pageSize: 10 }}
                            />
                        </TabPane>
                    </Tabs>
                </Space>
            </Card>

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
                destroyOnClose
            >
                {selectedUser && (
                    <div>
                        <Descriptions title="User Information" bordered column={2} size="small">
                            <Descriptions.Item label="Full Name">{selectedUser.firstName} {selectedUser.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{selectedUser.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Applied For">{selectedUser.role.replace('_', ' ').toUpperCase()}</Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        {renderApplicationDetails(selectedUser)}
                    </div>
                )}
            </Modal>

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
