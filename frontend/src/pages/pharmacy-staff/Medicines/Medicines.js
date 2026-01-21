import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Card, Table, Button, Form, Input, InputNumber, DatePicker, Row, Col, Space, Popconfirm, Tag, message, Modal, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MedicineBoxOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { medicinesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import './Medicines.css';

const PharmacyStaffMedicines = () => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [medicines, setMedicines] = useState([]);
    const [searchText, setSearchText] = useState('');
    const { user, loading: authLoading } = useAuth();

    const fetchMedicines = useCallback(async () => {
        if (!user?.pharmacyId) return;
        try {
            setLoading(true);
            const response = await medicinesAPI.getAll({ pharmacyId: user.pharmacyId });
            if (response.data.success) {
                const medicinesList = response.data.data.medicines || [];
                const formattedData = medicinesList.map(med => ({
                    key: med._id,
                    ...med,
                    price: med.price?.basePrice || 0,
                    expiryDate: med.expiryDate ? dayjs(med.expiryDate).format('YYYY-MM-DD') : 'N/A'
                }));
                setMedicines(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
            message.error('Failed to load medicines');
        } finally {
            setLoading(false);
        }
    }, [user?.pharmacyId]);

    useEffect(() => {
        if (user?.pharmacyId) {
            fetchMedicines();
        }
    }, [user, fetchMedicines]);

    const isEditing = !!editingKey;

    const showAddModal = () => {
        setEditingKey('');
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingKey('');
        form.resetFields();
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const data = {
                ...values,
                manufacturer: values.brand || values.name,
                stockQuantity: values.quantity,
                expiryDate: values.expiryDate.toISOString(),
                pharmacy: user.pharmacyId
            };

            if (editingKey) {
                const response = await medicinesAPI.update(editingKey, data);
                if (response.data.success) {
                    message.success('Medicine updated successfully');
                }
            } else {
                const response = await medicinesAPI.add(data);
                if (response.data.success) {
                    message.success('Medicine added successfully');
                }
            }
            setIsModalOpen(false);
            setEditingKey('');
            form.resetFields();
            fetchMedicines();
        } catch (error) {
            console.error('Failed to save medicine:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save medicine';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const edit = (record) => {
        form.setFieldsValue({
            ...record,
            expiryDate: record.expiryDate !== 'N/A' ? dayjs(record.expiryDate) : null,
        });
        setEditingKey(record.key);
        setIsModalOpen(true);
    };

    const handleDelete = async (key) => {
        try {
            setLoading(true);
            const response = await medicinesAPI.delete(key);
            if (response.data.success) {
                message.success('Medicine deleted');
                fetchMedicines();
            }
        } catch (error) {
            console.error('Failed to delete medicine:', error);
            message.error('Failed to delete medicine');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(searchText.toLowerCase()) ||
        med.category.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (tag) => <Tag color="blue">{tag}</Tag>
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (val) => `$${val?.toFixed(2) || '0.00'}`
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty) => (
                <Tag color={qty < 20 ? 'red' : 'green'}>{qty}</Tag>
            )
        },
        {
            title: 'Expiry',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => edit(record)}
                        className="action-btn-edit"
                    />
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (authLoading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading..." /></div>;
    }

    return (
        <div className="medicines-container">
            <Card
                title="Medicine Inventory"
                className="medicine-table-card"
                bordered={false}
                extra={
                    <Space>
                        <Input
                            placeholder="Search medicines..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                            Add Medicine
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredMedicines}
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: true }}
                />
            </Card>

            <Modal
                title={isEditing ? "Edit Medicine" : "Add New Medicine"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="name"
                        label="Medicine Name"
                        rules={[{ required: true, message: 'Please enter medicine name' }]}
                    >
                        <Input prefix={<MedicineBoxOutlined />} placeholder="e.g. Amoxicillin" />
                    </Form.Item>

                    <Form.Item
                        name="brand"
                        label="Brand Name"
                        rules={[{ required: true, message: 'Please enter brand name' }]}
                    >
                        <Input placeholder="e.g. Panadol" />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select category' }]}
                    >
                        <Select placeholder="Select Category">
                            <Select.Option value="otc">Over-the-Counter (OTC)</Select.Option>
                            <Select.Option value="prescription">Prescription</Select.Option>
                            <Select.Option value="supplement">Supplement</Select.Option>
                            <Select.Option value="herbal">Herbal</Select.Option>
                            <Select.Option value="medical_device">Medical Device</Select.Option>
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="dosageForm"
                                label="Physical Form"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Select placeholder="Select Form">
                                    <Select.Option value="tablet">Tablet</Select.Option>
                                    <Select.Option value="capsule">Capsule</Select.Option>
                                    <Select.Option value="syrup">Syrup</Select.Option>
                                    <Select.Option value="injection">Injection</Select.Option>
                                    <Select.Option value="cream">Cream</Select.Option>
                                    <Select.Option value="ointment">Ointment</Select.Option>
                                    <Select.Option value="drops">Drops</Select.Option>
                                    <Select.Option value="inhaler">Inhaler</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="requiresPrescription"
                                label="Prescription Required?"
                                initialValue={false}
                            >
                                <Select>
                                    <Select.Option value={true}>Yes</Select.Option>
                                    <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="strength"
                                label="Strength"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="e.g. 500mg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="packSize"
                                label="Pack Size"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="e.g. Box of 30" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="Price"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="quantity"
                                label="Quantity"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="expiryDate"
                        label="Expiry Date"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} placeholder="Brief description..." />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {isEditing ? 'Update Medicine' : 'Add Medicine'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PharmacyStaffMedicines;
