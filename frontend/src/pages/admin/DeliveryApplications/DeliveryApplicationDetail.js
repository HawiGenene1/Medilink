import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Typography, message, Modal, Input, Spin, Divider, Image } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../../../services/api';

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
            const response = await api.get(`/delivery/onboarding/admin/applications/${id}`);
            if (response.data && response.data.success) {
                setApplication(response.data.data);
            }
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
            await api.patch(`/delivery/onboarding/admin/applications/${id}/status`, {
                status: 'approved',
                reason: 'Verified and approved'
            });
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
            await api.patch(`/delivery/onboarding/admin/applications/${id}/status`, {
                status: 'rejected',
                reason: rejectionReason
            });
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

    const { documents } = application;

    return (
        <div style={{ padding: '24px' }}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin/registrations/pending')}
                style={{ marginBottom: '16px' }}
            >
                Back to List
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    Application Details
                    <Tag
                        color={application.onboardingStatus === 'approved' ? 'success' : application.onboardingStatus === 'rejected' ? 'error' : 'processing'}
                        style={{ marginLeft: '12px', verticalAlign: 'middle', fontSize: '14px', padding: '4px 10px' }}
                    >
                        {(application.onboardingStatus || 'pending').toUpperCase()}
                    </Tag>
                </Title>

                {application.onboardingStatus === 'pending_review' && (
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
                    <Descriptions.Item label="First Name">{application.personalDetails?.firstName || application.userId?.firstName || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Last Name">{application.personalDetails?.lastName || application.userId?.lastName || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{application.personalDetails?.email || application.userId?.email || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{application.personalDetails?.phoneNumber || application.userId?.phone || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        {(() => {
                            const addr = application.personalDetails?.residentialAddress;
                            if (!addr) return 'N/A';
                            if (typeof addr === 'string') return addr;
                            return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`.replace(/^, |, $/, '').trim() || 'N/A';
                        })()}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Vehicle Information" bordered={false} style={{ marginBottom: '16px' }}>
                <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
                    <Descriptions.Item label="Type">{(application.vehicleDetails?.vehicleType || 'N/A').toUpperCase()}</Descriptions.Item>
                    <Descriptions.Item label="License Plate">{application.vehicleDetails?.licensePlate || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Model">{application.vehicleDetails?.model || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Year">{application.vehicleDetails?.year || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Color">{application.vehicleDetails?.color || 'N/A'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Documents" bordered={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {application.documents && Object.entries(application.documents).map(([key, value], index) => {
                        if (!value) return null;

                        const renderDocumentCard = (docPath, docIndex = null) => {
                            if (typeof docPath !== 'string') return null;
                            const fileName = docPath.split('/').pop() || 'Document';
                            const title = docIndex !== null ? `${key.replace(/([A-Z])/g, ' $1').toUpperCase()} - ${docIndex + 1}` : key.replace(/([A-Z])/g, ' $1').toUpperCase();

                            return (
                                <Card
                                    key={docIndex !== null ? `${index}-${docIndex}` : index}
                                    type="inner"
                                    title={title}
                                    size="small"
                                >
                                    <div style={{ textAlign: 'center', padding: '10px' }}>
                                        <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '8px' }} />
                                        <div>
                                            <Text type="secondary" ellipsis>{fileName}</Text>
                                        </div>
                                        <Button
                                            type="link"
                                            onClick={() => window.open(`http://localhost:5000/${docPath}`, '_blank')}
                                        >
                                            View Document
                                        </Button>
                                    </div>
                                </Card>
                            );
                        };

                        if (Array.isArray(value)) {
                            return value.map((path, idx) => renderDocumentCard(path, idx));
                        }

                        return renderDocumentCard(value);
                    })}
                    {(!application.documents || Object.keys(application.documents).length === 0) && <Text type="secondary">No documents uploaded</Text>}
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
