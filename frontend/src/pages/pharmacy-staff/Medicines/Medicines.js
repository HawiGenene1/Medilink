import React, { useState } from 'react';
import { Card, Table, Button, Form, Input, InputNumber, DatePicker, Row, Col, Space, Popconfirm, Tag, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './Medicines.css';

const PharmacyStaffMedicines = () => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data State
    const [medicines, setMedicines] = useState([
        {
            key: '1',
            id: 'MED001',
            name: 'Amoxicillin 500mg',
            category: 'Antibiotics',
            price: 150.00,
            quantity: 12,
            expiryDate: '2024-12-31',
            description: 'Broad-spectrum antibiotic used to treat bacterial infections.'
        },
        {
            key: '2',
            id: 'MED002',
            name: 'Paracetamol 500mg',
            category: 'Pain Relief',
            price: 5.00,
            quantity: 500,
            expiryDate: '2025-06-30',
            description: 'Common pain reliever and fever reducer.'
        },
    ]);

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

    const onFinish = (values) => {
        if (editingKey) {
            // Update logic
            const newData = [...medicines];
            const index = newData.findIndex((item) => item.key === editingKey);
            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {
                    ...item,
                    ...values,
                    expiryDate: values.expiryDate.format('YYYY-MM-DD'),
                });
                setMedicines(newData);
                message.success('Medicine updated successfully');
            }
        } else {
            // Add logic
            const newMedicine = {
                key: Date.now().toString(),
                id: `MED${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                ...values,
                expiryDate: values.expiryDate.format('YYYY-MM-DD'),
            };
            setMedicines([...medicines, newMedicine]);
            message.success('Medicine added successfully');
        }
        setIsModalOpen(false);
        setEditingKey('');
        form.resetFields();
    };

    const edit = (record) => {
        form.setFieldsValue({
            ...record,
            expiryDate: dayjs(record.expiryDate),
        });
        setEditingKey(record.key);
        setIsModalOpen(true);
    };

    const handleDelete = (key) => {
        const newData = medicines.filter((item) => item.key !== key);
        setMedicines(newData);
        message.success('Medicine deleted');
    };

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
            render: (val) => `$${val.toFixed(2)}`
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

    return (
        <div className="medicines-container">
            <Card
                title="Medicine Inventory"
                className="medicine-table-card"
                bordered={false}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                        Add Medicine
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={medicines}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: true }} // Responsive scroll
                />
            </Card>

            <Modal
                title={isEditing ? "Edit Medicine" : "Add New Medicine"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
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
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please enter category' }]}
                    >
                        <Input placeholder="e.g. Antibiotics" />
                    </Form.Item>

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
                            <Button type="primary" htmlType="submit">
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
