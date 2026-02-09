import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Form,
    Input,
    Button,
    Row,
    Col,
    Divider,
    Space,
    TimePicker,
    Checkbox,
    message,
    Skeleton
} from 'antd';
import {
    MedicineBoxOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { pharmacyOwnerAPI } from '../../../services/api';

const { Title, Text, Paragraph } = Typography;

const PharmacyDetails = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);



    useEffect(() => {
        fetchPharmacyDetails();
    }, []);

    const setFields = (pharmacy) => {
        // Format opening hours for TimePicker
        const formattedHours = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const hours = pharmacy.openingHours?.[day] || { isClosed: true };
            formattedHours[day] = {
                open: hours.open ? dayjs(hours.open, 'HH:mm') : null,
                close: hours.close ? dayjs(hours.close, 'HH:mm') : null,
                isClosed: hours.isClosed
            };
        });

        form.setFieldsValue({
            name: pharmacy.name,
            licenseNumber: pharmacy.licenseNumber,
            email: pharmacy.email,
            phone: pharmacy.phone,
            street: pharmacy.address?.street,
            city: pharmacy.address?.city,
            state: pharmacy.address?.state,
            zipCode: pharmacy.address?.zipCode,
            country: pharmacy.address?.country || 'Ethiopia',
            description: pharmacy.description,
            openingHours: formattedHours
        });
    };

    const fetchPharmacyDetails = async () => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.getPharmacy();
            if (response.data.success) {
                setFields(response.data.data);
            }
        } catch (error) {
            if (error.response?.status !== 401) {
                message.error('Failed to load pharmacy details');
            }
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            setSaving(true);
            const formattedData = {
                name: values.name,
                email: values.email,
                phone: values.phone,
                description: values.description,
                address: {
                    street: values.street,
                    city: values.city,
                    state: values.state,
                    zipCode: values.zipCode,
                    country: values.country
                },
                openingHours: {}
            };

            // Format hours back to string
            Object.keys(values.openingHours || {}).forEach(day => {
                formattedData.openingHours[day] = {
                    open: values.openingHours[day].open ? values.openingHours[day].open.format('HH:mm') : null,
                    close: values.openingHours[day].close ? values.openingHours[day].close.format('HH:mm') : null,
                    isClosed: values.openingHours[day].isClosed
                };
            });

            const response = await pharmacyOwnerAPI.updatePharmacy(formattedData);
            if (response.data.success) {
                message.success('Pharmacy details updated successfully');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to update pharmacy details');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px' }}>
                <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 10 }} />
            </div>
        );
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <Title level={2}>Pharmacy Profile Management</Title>
                <Paragraph type="secondary">Manage your business information, operating hours, and public profile.</Paragraph>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <Card title={<Space><MedicineBoxOutlined /> Business Information</Space>} style={{ marginBottom: 24 }}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label="Pharmacy Name" name="name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="License Number" name="licenseNumber">
                                        <Input disabled prefix={<SafetyCertificateOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Contact Email" name="email" rules={[{ type: 'email' }]}>
                                        <Input prefix={<MailOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Phone Number" name="phone">
                                        <Input prefix={<PhoneOutlined />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="Business Description" name="description">
                                <Input.TextArea rows={4} placeholder="Describe your pharmacy services..." />
                            </Form.Item>
                        </Card>

                        <Card title={<Space><EnvironmentOutlined /> Location Details</Space>} style={{ marginBottom: 24 }}>
                            <Form.Item label="Street Address" name="street" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item label="City" name="city" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="State/Region" name="state" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="Zip Code" name="zipCode" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="Country" name="country" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card title={<Space><ClockCircleOutlined /> Operating Hours</Space>} style={{ marginBottom: 24 }}>
                            {days.map(day => (
                                <div key={day} style={{ marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8, textTransform: 'capitalize' }}>{day}</Text>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Form.Item name={['openingHours', day, 'isClosed']} valuePropName="checked" noStyle>
                                            <Checkbox>Closed on this day</Checkbox>
                                        </Form.Item>
                                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.openingHours?.[day]?.isClosed !== curr.openingHours?.[day]?.isClosed}>
                                            {({ getFieldValue }) => {
                                                const isClosed = getFieldValue(['openingHours', day, 'isClosed']);
                                                return (
                                                    <Space>
                                                        <Form.Item name={['openingHours', day, 'open']} noStyle>
                                                            <TimePicker format="HH:mm" disabled={isClosed} placeholder="Open" />
                                                        </Form.Item>
                                                        <Text>-</Text>
                                                        <Form.Item name={['openingHours', day, 'close']} noStyle>
                                                            <TimePicker format="HH:mm" disabled={isClosed} placeholder="Close" />
                                                        </Form.Item>
                                                    </Space>
                                                );
                                            }}
                                        </Form.Item>
                                    </Space>
                                    <Divider style={{ margin: '12px 0' }} />
                                </div>
                            ))}
                        </Card>

                        <Button type="primary" size="large" icon={<SaveOutlined />} block htmlType="submit" loading={saving}>
                            Save All Profile Changes
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default PharmacyDetails;
