import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Table, 
  Tag, 
  Space, 
  Upload, 
  Modal, 
  Form, 
  Input, 
  message, 
  Empty, 
  List, 
  Avatar, 
  Tooltip, 
  Popconfirm,
  Row,
  Col,
  Spin
} from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { prescriptionsAPI } from '../../../services/api';
import './styles.css';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionsAPI.getAll();
      setPrescriptions(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      message.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('prescription', file);
    
    try {
      setUploading(true);
      await prescriptionsAPI.upload(formData);
      message.success('Prescription uploaded successfully');
      fetchPrescriptions();
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('Failed to upload prescription');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const getStatusTag = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Approved</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="processing">Pending</Tag>;
      case 'rejected':
        return <Tag icon={<CloseCircleOutlined />} color="error">Rejected</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Prescription',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text, record) => (
        <Space>
          {record.fileType === 'application/pdf' ? (
            <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
          ) : (
            <FileImageOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
          )}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Uploaded On',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => window.open(record.fileUrl, '_blank')}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="prescriptions-page">
      <div className="page-header">
        <Title level={2}>My Prescriptions</Title>
        <Text type="secondary">Upload and manage your medical prescriptions</Text>
      </div>

      <Row gutter={[16, 16]} className="upload-section">
        <Col span={24}>
          <Card title="Upload New Prescription" className="upload-card">
            <Dragger
              name="prescription"
              multiple={false}
              beforeUpload={handleUpload}
              onPreview={handlePreview}
              accept=".pdf,.jpg,.jpeg,.png"
              showUploadList={false}
            >
              <div className="upload-area">
                <p className="ant-upload-drag-icon">
                  <PlusOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to upload
                </p>
                <p className="ant-upload-hint">
                  Supports PDF, JPG, JPEG, PNG (Max: 5MB)
                </p>
              </div>
            </Dragger>
            {uploading && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Spin />
                <div>Uploading...</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="prescriptions-list">
        <Col span={24}>
          <Card title="My Prescriptions" className="prescriptions-card">
            <Table
              columns={columns}
              dataSource={prescriptions}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
