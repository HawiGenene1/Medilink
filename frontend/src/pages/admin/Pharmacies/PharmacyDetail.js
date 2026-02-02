
import React from 'react';
import {
    Row, Col, Card, Button, Descriptions, Tag, Divider,
    Steps, Modal, Image, Typography, Space, Alert
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    FilePdfOutlined,
    ShopOutlined,
    StopOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Step } = Steps;

const PharmacyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock: Check if reviewing pending or managing active (based on ID convention or status)
    // For demo, let's assume id > 10 is active, else is pending
    const isPending = parseInt(id) < 10;

    const pharmacy = {
        name: isPending ? 'New Age Pharmacy' : 'Existing Mega Pharma',
        owner: 'Kebede T.',
        email: 'kebede@pharmacy.com',
        phone: '0911223344',
        address: 'Bole, near Edna Mall',
        license: 'LIC-2023-001',
        status: isPending ? 'Pending Review' : 'Active'
    };

    return (
        <div className="pharmacy-detail">
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back to List</Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>{pharmacy.name}</Title>
                    <Text type="secondary">Application ID: #{id}</Text>
                </div>
                <Tag color={isPending ? 'orange' : 'green'} style={{ fontSize: 16, padding: '5px 10px' }}>
                    {pharmacy.status}
                </Tag>
            </div>

            {/* Workflow Steps for Pending */}
            {isPending && (
                <Card style={{ marginBottom: 24 }}>
                    <Steps current={1}>
                        <Step title="Submitted" description="2023-11-20" />
                        <Step title="Under Review" description="Current Stage" />
                        <Step title="Decision" />
                    </Steps>
                </Card>
            )}

            <Row gutter={24}>
                <Col xs={24} lg={16}>
                    <Card title="Pharmacy Information" bordered={false} style={{ marginBottom: 24 }}>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Owner Name">{pharmacy.owner}</Descriptions.Item>
                            <Descriptions.Item label="License Number">{pharmacy.license}</Descriptions.Item>
                            <Descriptions.Item label="Email">{pharmacy.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{pharmacy.phone}</Descriptions.Item>
                            <Descriptions.Item label="Address" span={2}>{pharmacy.address}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="Documents Verification" bordered={false}>
                        <Space size="large" align="start">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 150, height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 8, border: '1px dashed #d9d9d9' }}>
                                    <FilePdfOutlined style={{ fontSize: 48, color: '#999' }} />
                                </div>
                                <Button type="link">Commercial License.pdf</Button>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 150, height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 8, border: '1px dashed #d9d9d9' }}>
                                    <FilePdfOutlined style={{ fontSize: 48, color: '#999' }} />
                                </div>
                                <Button type="link">Owner ID.pdf</Button>
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    {isPending ? (
                        <Card title="Approval Action" bordered={false} className="action-card">
                            <Alert
                                message="Ensure all documents are valid before approval."
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button type="primary" size="large" block icon={<CheckCircleOutlined />}>
                                    Approve Registration
                                </Button>
                                <Button danger size="large" block icon={<CloseCircleOutlined />}>
                                    Reject Application
                                </Button>
                            </Space>
                        </Card>
                    ) : (
                        <Card title="Management Actions" bordered={false}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button icon={<ShopOutlined />} block>View Public Profile</Button>
                                <Button danger icon={<StopOutlined />} block>Suspend Operations</Button>
                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default PharmacyDetail;
