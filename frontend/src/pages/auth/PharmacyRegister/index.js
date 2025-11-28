import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, DatePicker, Upload, message } from 'antd';
import { 
  ShopOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import './PharmacyRegister.css';

const { TextArea } = Input;

const PharmacyRegister = () => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Prepare form data for file uploads
      const formData = new FormData();
      
      // Add all form fields to formData
      Object.keys(values).forEach(key => {
        if (key === 'establishedDate') {
          formData.append(key, values[key].format('YYYY-MM-DD'));
        } else if (key === 'address') {
          formData.append('address', JSON.stringify(values[key]));
        } else if (values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      // Add files to formData
      fileList.forEach(file => {
        formData.append('documents', file.originFileObj);
      });

      // Send registration request
      const response = await fetch('http://localhost:5000/api/pharmacy/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Pharmacy registration submitted for approval. We will contact you soon!');
        // Redirect to status check page
        navigate(`/pharmacy/status/${data.data.id}`);
      } else {
        message.error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isPdfOrImage = file.type === 'application/pdf' || file.type.startsWith('image/');
    if (!isPdfOrImage) {
      message.error('You can only upload PDF or image files!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
    }
    return isPdfOrImage && isLt5M ? true : Upload.LIST_IGNORE;
  };

  return (
    <div className="pharmacy-register-container">
      <Card className="pharmacy-register-card" hoverable>
        <div className="register-header">
          <h2>Pharmacy Registration</h2>
          <p>Fill in your pharmacy details to register</p>
        </div>
        
        <Form
          form={form}
          name="pharmacyRegister"
          onFinish={onFinish}
          layout="vertical"
          scrollToFirstError
        >
          {/* Pharmacy Information */}
          <div className="form-section">
            <h3>Pharmacy Information</h3>
            <div className="form-row">
              <Form.Item
                name="pharmacyName"
                label="Pharmacy Name"
                rules={[{ required: true, message: 'Please input your pharmacy name!' }]}
                className="form-item"
              >
                <Input prefix={<ShopOutlined />} placeholder="Pharmacy Name" />
              </Form.Item>

              <Form.Item
                name="licenseNumber"
                label="License Number"
                rules={[{ required: true, message: 'Please input your license number!' }]}
                className="form-item"
              >
                <Input prefix={<IdcardOutlined />} placeholder="License Number" />
              </Form.Item>
            </div>

            <Form.Item
              name="establishedDate"
              label="Established Date"
              rules={[{ required: true, message: 'Please select establishment date!' }]}
              className="form-item"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3>Contact Information</h3>
            <Form.Item
              name="ownerName"
              label="Owner's Full Name"
              rules={[{ required: true, message: 'Please input owner\'s name!' }]}
              className="form-item"
            >
              <Input prefix={<UserOutlined />} placeholder="Owner's Name" />
            </Form.Item>

            <div className="form-row">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
                className="form-item"
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please input your phone number!' }]}
                className="form-item"
              >
                <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
              </Form.Item>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Information</h3>
            <Form.Item
              name={['address', 'street']}
              label="Street Address"
              rules={[{ required: true, message: 'Please input your street address!' }]}
              className="form-item"
            >
              <Input placeholder="Street Address" />
            </Form.Item>

            <div className="form-row">
              <Form.Item
                name={['address', 'city']}
                label="City"
                rules={[{ required: true, message: 'Please input your city!' }]}
                className="form-item"
              >
                <Input placeholder="City" />
              </Form.Item>

              <Form.Item
                name={['address', 'state']}
                label="State/Region"
                rules={[{ required: true, message: 'Please input your state/region!' }]}
                className="form-item"
              >
                <Input placeholder="State/Region" />
              </Form.Item>

              <Form.Item
                name={['address', 'postalCode']}
                label="Postal Code"
                rules={[{ required: true, message: 'Please input your postal code!' }]}
                className="form-item"
              >
                <Input placeholder="Postal Code" />
              </Form.Item>
            </div>
          </div>

          {/* Business Information */}
          <div className="form-section">
            <h3>Business Information</h3>
            <Form.Item
              name="tinNumber"
              label="TIN Number"
              rules={[{ required: true, message: 'Please input your TIN number!' }]}
              className="form-item"
            >
              <Input prefix={<IdcardOutlined />} placeholder="TIN Number" />
            </Form.Item>

            <Form.Item
              name="additionalInfo"
              label="Additional Information"
              className="form-item"
            >
              <TextArea rows={4} placeholder="Any additional information about your pharmacy" />
            </Form.Item>
          </div>

          {/* Document Upload */}
          <div className="form-section">
            <h3>Required Documents</h3>
            <p className="document-note">Please upload the following documents (PDF or image, max 5MB each):</p>
            
            <Form.Item
              name="licenseDocument"
              label="Business License"
              rules={[{ required: true, message: 'Please upload your business license!' }]}
              className="form-item"
            >
              <Upload
                name="licenseDocument"
                listType="picture"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Click to upload</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="tinDocument"
              label="TIN Certificate"
              rules={[{ required: true, message: 'Please upload your TIN certificate!' }]}
              className="form-item"
            >
              <Upload
                name="tinDocument"
                listType="picture"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Click to upload</Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item className="form-actions">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="register-button"
            >
              Submit Registration
            </Button>
            <div className="login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PharmacyRegister;
