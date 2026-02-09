import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, DatePicker, Upload, message } from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../../../services/api';
import './PharmacyRegister.css';

const { TextArea } = Input;
const PharmacyRegister = () => {
  const [loading, setLoading] = useState(false);
  const [licenseFileList, setLicenseFileList] = useState([]);
  const [tinFileList, setTinFileList] = useState([]);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // 1. Process text fields
      Object.keys(values).forEach(key => {
        if (key !== 'address' && key !== 'licenseDocument' && key !== 'tinDocument' && key !== 'establishedDate') {
          if (values[key] !== undefined && values[key] !== null) {
            formData.append(key, values[key]);
          }
        }
      });

      // 2. Format establishedDate
      if (values.establishedDate) {
        formData.append('establishedDate', values.establishedDate.toISOString());
      }

      // 3. Flatten address
      if (values.address) {
        Object.keys(values.address).forEach(subKey => {
          if (values.address[subKey]) {
            formData.append(`address[${subKey}]`, values.address[subKey]);
          }
        });
      }

      // 4. Append files
      if (licenseFileList[0]?.originFileObj) {
        formData.append('licenseDocument', licenseFileList[0].originFileObj);
      }
      if (tinFileList[0]?.originFileObj) {
        formData.append('tinDocument', tinFileList[0].originFileObj);
      }
      const response = await api.post('/pharmacy/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        message.success({
          content: 'Pharmacy registration submitted successfully! Your application is pending approval. You will receive an email with login credentials once approved.',
          duration: 8
        });
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } else {
        const errorMsg = response.data.errors ? `Validation failed: ${response.data.errors.join(', ')}` : (response.data.message || 'Registration failed.');
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('Registration error details:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.errors?.join(', ');
      message.error(serverMsg || 'Network error: Backend server might be unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e && e.fileList;
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
          initialValues={{ address: { city: '', street: '', state: '', postalCode: '' } }}
        >
          {/* Pharmacy Information */}
          <div className="form-section">
            <h3>Pharmacy Information</h3>
            <div className="form-row">
              <Form.Item
                name="pharmacyName"
                label="Pharmacy Name"
                rules={[{ required: true, message: 'Pharmacy name is required' }]}
                className="form-item"
              >
                <Input prefix={<ShopOutlined />} placeholder="Pharmacy Name" />
              </Form.Item>

              <Form.Item
                name="licenseNumber"
                label="License Number"
                rules={[{ required: true, message: 'License number is required' }]}
                className="form-item"
              >
                <Input prefix={<IdcardOutlined />} placeholder="License Number" />
              </Form.Item>
            </div>

            <Form.Item
              name="establishedDate"
              label="Established Date"
              rules={[{ required: true, message: 'Please select establishment date' }]}
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
              rules={[{ required: true, message: 'Owner name is required' }]}
              className="form-item"
            >
              <Input prefix={<UserOutlined />} placeholder="Owner's Name" />
            </Form.Item>

            <div className="form-row">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Invalid email' }
                ]}
                className="form-item"
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Phone is required' }]}
                className="form-item"
              >
                <Input prefix={<PhoneOutlined />} placeholder="Phone" />
              </Form.Item>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Information</h3>
            <Form.Item
              name={['address', 'street']}
              label="Street Address"
              rules={[{ required: true, message: 'Street is required' }]}
              className="form-item"
            >
              <Input placeholder="Street Address" />
            </Form.Item>

            <div className="form-row">
              <Form.Item
                name={['address', 'city']}
                label="City"
                rules={[{ required: true, message: 'City is required' }]}
                className="form-item"
              >
                <Input placeholder="City" />
              </Form.Item>

              <Form.Item
                name={['address', 'state']}
                label="State/Region"
                rules={[{ required: true, message: 'State is required' }]}
                className="form-item"
              >
                <Input placeholder="State/Region" />
              </Form.Item>

              <Form.Item
                name={['address', 'postalCode']}
                label="Postal Code"
                rules={[{ required: true, message: 'Postal code is required' }]}
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
              rules={[{ required: true, message: 'TIN number is required' }]}
              className="form-item"
            >
              <Input prefix={<IdcardOutlined />} placeholder="TIN Number" />
            </Form.Item>

            <Form.Item
              name="additionalInfo"
              label="Additional Information"
              className="form-item"
            >
              <TextArea rows={4} placeholder="Optional notes" />
            </Form.Item>
          </div>

          {/* Document Upload */}
          <div className="form-section">
            <h3>Required Documents</h3>
            <p className="document-note">PDF or image, max 5MB.</p>

            <Form.Item
              name="licenseDocument"
              label="Business License"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: 'License document is required' }]}
              className="form-item"
            >
              <Upload
                listType="picture"
                fileList={licenseFileList}
                beforeUpload={beforeUpload}
                onChange={({ fileList }) => setLicenseFileList(fileList)}
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Upload License</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="tinDocument"
              label="TIN Certificate"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: 'TIN certificate is required' }]}
              className="form-item"
            >
              <Upload
                listType="picture"
                fileList={tinFileList}
                beforeUpload={beforeUpload}
                onChange={({ fileList }) => setTinFileList(fileList)}
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Upload TIN</Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item className="form-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="register-button"
              block
            >
              Submit Registration
            </Button>
            <div className="login-link" style={{ textAlign: 'center', marginTop: '16px' }}>
              Already have an account? <Link to="/auth/login">Login here</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PharmacyRegister;
