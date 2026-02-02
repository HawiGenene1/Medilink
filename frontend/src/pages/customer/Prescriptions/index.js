import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Upload, Tag, Table, Space, Alert, Modal } from 'antd';
import {
  InboxOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import './Prescriptions.css';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const Prescriptions = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // Mock Data for Prescriptions
  const prescriptions = [
    {
      id: 'RX-8821',
      fileName: 'amoxicillin_rx_jan.pdf',
      date: '2026-01-15',
      status: 'Verified',
      pharmacy: 'Kenema Pharmacy No. 4',
      expiryDate: '2026-07-15'
    },
    {
      id: 'RX-8815',
      fileName: 'chronic_needs_doc.jpg',
      date: '2026-01-10',
      status: 'Pending',
      pharmacy: 'Awaiting Selection',
      expiryDate: 'N/A'
    },
    {
      id: 'RX-8790',
      fileName: 'old_prescription.pdf',
      date: '2025-11-20',
      status: 'Expired',
      pharmacy: 'City Central Pharma',
      expiryDate: '2026-01-05'
    }
  ];

  const getStatusTag = (status) => {
    switch (status) {
      case 'Verified': return <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: '6px', marginRight: '16px' }}>Verified</Tag>;
      case 'Pending': return <Tag color="processing" icon={<ClockCircleOutlined />} style={{ borderRadius: '6px', fontWeight: 500, marginRight: '16px' }}>Pending Review</Tag>;
      case 'Expired': return <Tag color="default" style={{ borderRadius: '6px', marginRight: '16px' }}>Expired</Tag>;
      case 'Rejected': return <Tag color="error" icon={<CloseCircleOutlined />} style={{ borderRadius: '6px', marginRight: '16px' }}>Rejected</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Prescription ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 250,
      ellipsis: true,
      render: (text) => (
        <Space>
          <FileProtectOutlined style={{ color: '#1E88E5' }} />
          <Text title={text}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Uploaded On',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Pharmacy',
      dataIndex: 'pharmacy',
      key: 'pharmacy',
      width: 200,
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: () => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} type="text" />
          <Button size="small" icon={<DownloadOutlined />} type="text" />
        </Space>
      )
    }
  ];

  return (
    <div className="prescriptions-page fade-in">
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={2}>My Prescriptions</Title>
          <Text type="secondary">Manage your medical documents and clinical authorizations.</Text>
        </div>
        <Button type="primary" size="large" icon={<InboxOutlined />} onClick={() => setUploadModalVisible(true)}>
          Upload New Rx
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <Card bordered={false} className="clinical-card">
            <Table
              columns={columns}
              dataSource={prescriptions}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 1000 }}
              tableLayout="fixed"
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Why verify?" className="safety-card">
            <Paragraph style={{ fontSize: '13px' }}>
              Medicines in Ethiopia classified as "Prescription Only" require a clinical authorization signed by a certified practitioner.
            </Paragraph>
            <Alert
              message="Digital Security"
              description="Your documents are encrypted and only accessible by licensed pharmacists."
              type="info"
              showIcon
            />
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>Accepted Formats</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>PDF, JPG, PNG (Max 5MB)</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Upload Prescription"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="upload-modal-content">
          <Dragger
            multiple={false}
            action="/api/upload" // Placeholder
            className="rx-dragger"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag prescription to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single scan per upload. Please ensure the doctor's stamp and signature are clearly visible.
            </p>
          </Dragger>
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button style={{ marginRight: '8px' }} onClick={() => setUploadModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => setUploadModalVisible(false)}>
              Submit for Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Prescriptions;
