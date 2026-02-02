import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Form,
  Input,
  Select,
  message,
  Spin,
  Modal,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Tag
} from 'antd';
import {
  UploadOutlined,
  CameraOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api/config';
import './PrescriptionUpload.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const PrescriptionUpload = () => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [pharmacies, setPharmacies] = useState([]);

  React.useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      // This would be implemented when pharmacy API is ready
      // const response = await api.get('/pharmacies');
      // setPharmacies(response.data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    }
  };

  const handleUpload = async (file) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type);
    const isValidSize = file.size / 1024 / 1024 < 5; // 5MB

    if (!isValidType) {
      message.error('You can only upload JPG, PNG or PDF files!');
      return false;
    }

    if (!isValidSize) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    setUploadedFile(file);
    return false; // Prevent automatic upload
  };

  const handleSubmit = async (values) => {
    if (!uploadedFile) {
      message.error('Please upload a prescription image');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('prescription', uploadedFile);
    formData.append('notes', values.notes || '');
    formData.append('pharmacyId', values.pharmacyId || '');
    formData.append('urgency', values.urgency || 'normal');

    try {
      const response = await api.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Prescription uploaded successfully!');
      form.resetFields();
      setUploadedFile(null);
      
      // Show success modal with details
      Modal.success({
        title: 'Prescription Uploaded Successfully',
        content: (
          <div>
            <p>Your prescription has been uploaded and is pending review.</p>
            <p><strong>Prescription ID:</strong> {response.data.data.prescriptionId}</p>
            <p><strong>Status:</strong> {response.data.data.status}</p>
            <p>You will be notified once the pharmacy reviews your prescription.</p>
          </div>
        ),
        okText: 'View My Prescriptions',
        onOk: () => {
          // Navigate to prescriptions list
          window.location.href = '/customer/prescriptions';
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.message || 'Failed to upload prescription');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (file) => {
    if (file.type.startsWith('image/')) {
      setPreviewImage(URL.createObjectURL(file));
      setPreviewVisible(true);
    } else {
      message.info('PDF preview not available. Please download the file to view.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    form.resetFields(['prescription']);
  };

  const uploadProps = {
    name: 'prescription',
    multiple: false,
    beforeUpload: handleUpload,
    showUploadList: false,
    accept: 'image/*,.pdf'
  };

  return (
    <div className="prescription-upload-container">
      <Row justify="center">
        <Col xs={24} md={20} lg={16} xl={12}>
          <Card className="upload-card">
            <div className="upload-header">
              <Title level={3}>
                <FileImageOutlined /> Upload Prescription
              </Title>
              <Text type="secondary">
                Upload your prescription image for pharmacy review. Our pharmacists will review it and contact you shortly.
              </Text>
            </div>

            <Alert
              message="Prescription Requirements"
              description={
                <ul>
                  <li>Clear, readable prescription image</li>
                  <li>Doctor's name and signature visible</li>
                  <li>Patient name and date visible</li>
                  <li>Medication names and dosages readable</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="upload-form"
            >
              <Form.Item
                name="prescription"
                label="Prescription Image"
                rules={[{ required: true, message: 'Please upload prescription image' }]}
              >
                <Dragger {...uploadProps} className="upload-dragger">
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag prescription image to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for JPG, PNG or PDF files. Maximum file size 5MB.
                  </p>
                </Dragger>
              </Form.Item>

              {uploadedFile && (
                <Card size="small" className="uploaded-file-preview">
                  <div className="file-info">
                    <Space>
                      <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div>
                        <Text strong>{uploadedFile.name}</Text>
                        <br />
                        <Text type="secondary">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      </div>
                    </Space>
                    <Space>
                      <Button
                        type="link"
                        icon={<CameraOutlined />}
                        onClick={() => handlePreview(uploadedFile)}
                      >
                        Preview
                      </Button>
                      <Button
                        type="link"
                        danger
                        onClick={removeFile}
                      >
                        Remove
                      </Button>
                    </Space>
                  </div>
                </Card>
              )}

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="pharmacyId"
                    label="Preferred Pharmacy (Optional)"
                  >
                    <Select
                      placeholder="Select a pharmacy"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {pharmacies.map(pharmacy => (
                        <Option key={pharmacy._id} value={pharmacy._id}>
                          {pharmacy.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="urgency"
                    label="Urgency Level"
                    initialValue="normal"
                  >
                    <Select>
                      <Option value="low">
                        <Tag color="green">Low</Tag>
                      </Option>
                      <Option value="normal">
                        <Tag color="blue">Normal</Tag>
                      </Option>
                      <Option value="high">
                        <Tag color="orange">High</Tag>
                      </Option>
                      <Option value="urgent">
                        <Tag color="red">Urgent</Tag>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Additional Notes (Optional)"
              >
                <TextArea
                  rows={4}
                  placeholder="Add any special instructions or notes for the pharmacist..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={uploading}
                  size="large"
                  block
                  icon={<CheckCircleOutlined />}
                >
                  {uploading ? 'Uploading...' : 'Upload Prescription'}
                </Button>
              </Form.Item>
            </Form>

            <div className="upload-tips">
              <Title level={5}>Tips for Best Results:</Title>
              <ul>
                <li>Ensure good lighting when taking photos</li>
                <li>Place prescription on flat surface</li>
                <li>Aide glare and shadows</li>
                <li>Capture entire prescription in frame</li>
                <li>Use high resolution camera if possible</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        visible={previewVisible}
        title="Prescription Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        <img
          alt="Prescription preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default PrescriptionUpload;
