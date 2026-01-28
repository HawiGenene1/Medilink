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
    const [activeTab, setActiveTab] = useState('all');

    const fetchData = async (role = '') => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/registrations/pending${role ? `?role=${role}` : ''}`);
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
                fetchData(activeTab === 'all' ? '' : activeTab);
            }
        } catch (error) {
            message.error(`Failed to ${actionType} user`);
            console.error(error);
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
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'blue';
                let icon = <UserOutlined />;
                if (role === 'pharmacy_admin') {
                    color = 'green';
                    icon = <ShopOutlined />;
                } else if (role === 'delivery') {
                    color = 'volcano';
                    icon = <CarOutlined />;
                }
                return <Tag color={color} icon={icon}>{role.toUpperCase()}</Tag>;
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
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EyeOutlined />} onClick={() => showDetails(record)}>View</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => openActionModal(record, 'approve')} ghost>Approve</Button>
                    <Button danger icon={<CloseOutlined />} onClick={() => openActionModal(record, 'reject')} ghost>Reject</Button>
                </Space>
            ),
        },
    ];

    const renderApplicationDetails = (user) => {
        if (!user || !user.applicationDetails) return <Text type="secondary">No extra details provided</Text>;

        if (user.role === 'pharmacy_admin') {
            const details = user.applicationDetails;
            return (
                <Descriptions title="Pharmacy Details" bordered column={1} size="small">
                    <Descriptions.Item label="Pharmacy Name">{details.name}</Descriptions.Item>
                    <Descriptions.Item label="License Number">{details.licenseNumber}</Descriptions.Item>
                    <Descriptions.Item label="Address">
                        {details.address.street}, {details.address.city}, {details.address.state} {details.address.zipCode}
                    </Descriptions.Item>
                </Descriptions>
            );
        }

        if (user.role === 'delivery') {
            const details = user.applicationDetails;
            return (
                <Descriptions title="Delivery Details" bordered column={1} size="small">
                    <Descriptions.Item label="Vehicle Type">{details.vehicleInfo?.vehicleType}</Descriptions.Item>
                    <Descriptions.Item label="License Plate">{details.vehicleInfo?.licensePlate}</Descriptions.Item>
                    <Descriptions.Item label="Address">
                        {details.address?.street}, {details.address?.city}, {details.address?.state} {details.address?.zipCode}
                    </Descriptions.Item>
                </Descriptions>
            );
        }

        return null;
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Title level={2}>Pending Registrations</Title>
                    <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); fetchData(key === 'all' ? '' : key); }}>
                        <TabPane tab="All Applications" key="all" />
                        <TabPane tab="Pharmacy Owners" key="pharmacy_admin" />
                        <TabPane tab="Delivery Personnel" key="delivery" />
                    </Tabs>
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
                width={700}
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
