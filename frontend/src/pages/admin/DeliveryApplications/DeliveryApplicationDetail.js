import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Typography, message, Modal, Input, Spin, Divider, Image } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DeliveryApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchApplication = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`http://localhost:5000/api/delivery/admin/applications/${id}`, config);
            setApplication(response.data);
        } catch (error) {
            console.error('Error fetching application details:', error);
            message.error('Failed to load application details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplication();
    }, [id]);

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5000/api/delivery/admin/applications/${id}/approve`, {}, config);
            message.success('Application approved successfully');
            fetchApplication(); // Refresh to show updated status
        } catch (error) {
            console.error('Error approving application:', error);
            message.error(error.response?.data?.message || 'Failed to approve application');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            message.error('Please provide a rejection reason');
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5000/api/delivery/admin/applications/${id}/reject`, { reason: rejectionReason }, config);
            message.success('Application rejected');
            setRejectModalVisible(false);
            fetchApplication();
        } catch (error) {
            console.error('Error rejecting application:', error);
            message.error(error.response?.data?.message || 'Failed to reject application');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    if (!application) {
        return <div style={{ padding: '24px' }}>Application not found</div>;
    }

    const { personalInfo, vehicleInfo, documents, status } = application;

    return (
        <div style={{ padding: '24px' }}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin/delivery-applications')}
                style={{ marginBottom: '16px' }}
            >
                Back to List
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    Application Details
                    <Tag
                        color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'processing'}
                        style={{ marginLeft: '12px', verticalAlign: 'middle', fontSize: '14px', padding: '4px 10px' }}
                    >
                        {status.toUpperCase()}
                    </Tag>
                </Title>

                {status === 'pending' && (
                    <Space>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => setRejectModalVisible(true)}
                            loading={actionLoading}
                        >
                            Reject
                        </Button>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleApprove}
                            loading={actionLoading}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Approve
                        </Button>
                    </Space>
                )}
            </div>

            <Card title="Personal Information" bordered={false} style={{ marginBottom: '16px' }}>
                <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
                    <Descriptions.Item label="First Name">{personalInfo.firstName}</Descriptions.Item>
                    <Descriptions.Item label="Last Name">{personalInfo.lastName}</Descriptions.Item>
                    <Descriptions.Item label="Email">{personalInfo.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{personalInfo.phone}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        {`${personalInfo.address?.street}, ${personalInfo.address?.city}, ${personalInfo.address?.state}, ${personalInfo.address?.country}`}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Vehicle Information" bordered={false} style={{ marginBottom: '16px' }}>
                <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
                    <Descriptions.Item label="Type">{vehicleInfo.vehicleType.toUpperCase()}</Descriptions.Item>
                    <Descriptions.Item label="License Plate">{vehicleInfo.licensePlate}</Descriptions.Item>
                    <Descriptions.Item label="Model">{vehicleInfo.model || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Year">{vehicleInfo.year || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Color">{vehicleInfo.color || 'N/A'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Documents" bordered={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {documents.map((doc, index) => (
                        <Card
                            key={index}
                            type="inner"
                            title={doc.documentType.replace('_', ' ').toUpperCase()}
                            size="small"
                        >
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                                {/* Mockup image/icon since we don't have real URLs yet */}
                                <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '8px' }} />
                                <div>
                                    <Text type="secondary" ellipsis>{doc.documentName || 'Document.pdf'}</Text>
                                </div>
                                <Button type="link" href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                                    View Document
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {documents.length === 0 && <Text type="secondary">No documents uploaded</Text>}
                </div>
            </Card>

            <Modal
                title="Reject Application"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => setRejectModalVisible(false)}
                okText="Reject"
                okType="danger"
                cancelText="Cancel"
                confirmLoading={actionLoading}
            >
                <p>Please provide a reason for rejecting this application:</p>
                <TextArea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Invalid license, Missing documents..."
                />
            </Modal>
        </div>
    );
};

export default DeliveryApplicationDetail;
