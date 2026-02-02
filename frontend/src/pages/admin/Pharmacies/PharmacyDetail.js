import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Button, Descriptions, Tag, Divider,
    Steps, Spin, Modal, Typography, Space, Alert, message
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    FilePdfOutlined,
    ShopOutlined,
    StopOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;
const { Step } = Steps;

const PharmacyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [pharmacy, setPharmacy] = useState(null);

    const fetchPharmacyDetails = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPharmacyById(id);
            if (response.success) {
                setPharmacy(response.data);
            } else {
                message.error(response.message || 'Failed to fetch pharmacy details');
            }
        } catch (error) {
            console.error('Error fetching pharmacy details:', error);
            message.error('An error occurred while fetching details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPharmacyDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!pharmacy) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Title level={4}>Pharmacy Not Found</Title>
                <Button onClick={() => navigate('/admin/pharmacies')}>Back to List</Button>
            </div>
        );
    }

    // Determine status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'green';
            case 'approved': return 'green'; // Normalize
            case 'suspended': return 'red';
            case 'pending': return 'orange';
            default: return 'default';
        }
    };

    return (
        <div className="pharmacy-detail fade-in">
            <Button onClick={() => navigate('/admin/pharmacies')} style={{ marginBottom: 16 }}>&larr; Back to List</Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>{pharmacy.name}</Title>
                    <Text type="secondary">Pharmacy ID: {pharmacy._id}</Text>
                </div>
                <Space>
                    <Tag color={getStatusColor(pharmacy.status)} style={{ fontSize: 16, padding: '5px 10px' }}>
                        {pharmacy.status?.toUpperCase() || 'UNKNOWN'}
                    </Tag>
                    <Button icon={<ReloadOutlined />} onClick={fetchPharmacyDetails} />
                </Space>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={16}>
                    <Card title="Pharmacy Information" bordered={false} style={{ marginBottom: 24 }} className="premium-card">
                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Owner Name">{pharmacy.ownerName || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="License Number">{pharmacy.licenseNumber || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Email">{pharmacy.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{pharmacy.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Address" span={2}>
                                {pharmacy.address ? `${pharmacy.address.street || ''}, ${pharmacy.address.city || ''}` : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Orders">{pharmacy.totalOrders || 0}</Descriptions.Item>
                            <Descriptions.Item label="Joined Date">{new Date(pharmacy.createdAt).toLocaleDateString()}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="Documents & Verification" bordered={false} className="premium-card">
                        <Alert message="Documents were verified during registration." type="success" showIcon style={{ marginBottom: 16 }} />
                        <Space size="large" align="start">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 120, height: 150, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 8, border: '1px solid #d9d9d9' }}>
                                    <FilePdfOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                                </div>
                                <Button type="link" size="small">License Document</Button>
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Management Actions" bordered={false} className="premium-card">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button icon={<ShopOutlined />} block>View Public Profile</Button>
                            {pharmacy.isActive ? (
                                <Button danger icon={<StopOutlined />} block onClick={() => message.info('Suspend functionality coming soon')}>Suspend Operations</Button>
                            ) : (
                                <Button type="primary" icon={<CheckCircleOutlined />} block onClick={() => message.info('Activate functionality coming soon')}>Activate Operations</Button>
                            )}
                        </Space>
                    </Card>

                    <Card title="Subscription Status" bordered={false} style={{ marginTop: 24 }} className="premium-card">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Plan">{pharmacy.subscription?.plan || 'Free Tier'}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={pharmacy.subscription?.status === 'active' ? 'success' : 'default'}>
                                    {pharmacy.subscription?.status || 'Inactive'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Expires">{pharmacy.subscription?.expiresAt ? new Date(pharmacy.subscription.expiresAt).toLocaleDateString() : 'N/A'}</Descriptions.Item>
                        </Descriptions>
                        <Button type="primary" ghost block style={{ marginTop: 12 }}>Manage Subscription</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PharmacyDetail;
