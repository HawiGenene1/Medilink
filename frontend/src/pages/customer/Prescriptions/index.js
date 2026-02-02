import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Upload, List, Tag, Table, Space, Alert, Modal, theme, Avatar, notification, Input } from 'antd';
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
import { getPrescriptions, uploadPrescription } from '../../../services/api/prescriptions';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const Prescriptions = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const { token } = theme.useToken();

  React.useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await getPrescriptions();
      if (response.success) {
        setPrescriptions(response.data.prescriptions.map(p => ({
          key: p._id,
          id: p._id.substring(p._id.length - 8).toUpperCase(),
          fileName: p.originalName,
          imageUrl: p.imageUrl,
          date: new Date(p.uploadedAt).toLocaleDateString(),
          status: p.status === 'pending_review' ? 'Pending' :
            p.status === 'approved' ? 'Verified' :
              p.status === 'rejected' ? 'Rejected' :
                p.status === 'processed' ? 'Processed' : 'Completed',
          pharmacy: p.pharmacy?.name || 'Awaiting Selection',
          expiryDate: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'
        })));
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch prescriptions.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      notification.warning({ message: 'Please select a file' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('prescription', fileList[0]);
    formData.append('notes', notes);

    try {
      const response = await uploadPrescription(formData);
      if (response.success) {
        notification.success({ message: 'Prescription uploaded successfully' });
        setUploadModalVisible(false);
        setFileList([]);
        setNotes('');
        fetchPrescriptions();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      notification.error({
        message: 'Upload Failed',
        description: error.response?.data?.message || 'Error uploading prescription.'
      });
    } finally {
      setUploading(false);
    }
  };

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
          <FileProtectOutlined style={{ color: token.colorPrimary }} />
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            type="text"
            onClick={() => {
              setPreviewImage(`http://localhost:5000${record.imageUrl}`);
              setPreviewVisible(true);
            }}
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            type="text"
            href={`http://localhost:5000${record.imageUrl}`}
            download={record.fileName}
            target="_blank"
          />
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
          <Card
            bordered={false}
            className="clinical-card"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <Table
              columns={columns}
              dataSource={prescriptions}
              rowKey="key"
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 1000 }}
              tableLayout="fixed"
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title="Why verify?"
            className="safety-card"
            style={{
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <Paragraph style={{ fontSize: '13px' }}>
              Medicines in Ethiopia classified as "Prescription Only" require a clinical authorization signed by a certified practitioner.
            </Paragraph>
            <Alert
              message="Digital Security"
              description="Your documents are encrypted and only accessible by licensed pharmacists."
              type="info"
              showIcon
              style={{ background: token.colorInfoBg, borderColor: token.colorInfoBorder }}
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
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setNotes('');
        }}
        footer={null}
        width={600}
      >
        <div className="upload-modal-content">
          <Dragger
            multiple={false}
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            className="rx-dragger"
            style={{
              background: token.colorFillAlter,
              borderColor: token.colorBorderDash
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: token.colorPrimary }} />
            </p>
            <p className="ant-upload-text">Click or drag prescription to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single scan per upload. Please ensure the doctor's stamp and signature are clearly visible.
            </p>
          </Dragger>

          <div style={{ marginTop: '20px' }}>
            <Text strong>Additional Notes (Optional)</Text>
            <Input.TextArea
              rows={3}
              placeholder="e.g. For recurring migraine medicine..."
              style={{ marginTop: '8px', borderRadius: '8px' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              style={{ marginRight: '8px' }}
              onClick={() => {
                setUploadModalVisible(false);
                setFileList([]);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0}
            >
              Submit for Review
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={previewVisible}
        title="Prescription Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img
          alt="prescription"
          style={{ width: '100%', borderRadius: '8px' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default Prescriptions;
