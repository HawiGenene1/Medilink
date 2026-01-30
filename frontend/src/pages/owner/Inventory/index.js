import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Card,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Space,
    Tag,
    Typography,
    message,
    Popconfirm,
    Alert,
    Row,
    Col
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    MedicineBoxOutlined,
    LockOutlined,
    AlertOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data for development
const MOCK_MEDICINES = [
    {
        _id: 'med-1',
        name: 'Paracetamol 500mg',
        category: 'Pain Relief',
        manufacturer: 'PharmaCorp',
        price: 25.50,
        stock: 450,
        expiryDate: '2026-12-31',
        description: 'Pain and fever relief'
    },
    {
        _id: 'med-2',
        name: 'Amoxicillin 250mg',
        category: 'Antibiotic',
        manufacturer: 'MedLife',
        price: 120.00,
        stock: 180,
        expiryDate: '2025-08-15',
        description: 'Bacterial infection treatment'
    },
    {
        _id: 'med-3',
        name: 'Ibuprofen 400mg',
        category: 'Pain Relief',
        manufacturer: 'HealthPlus',
        price: 35.00,
        stock: 25,
        expiryDate: '2026-03-20',
        description: 'Anti-inflammatory'
    },
    {
        _id: 'med-4',
        name: 'Vitamin C 1000mg',
        category: 'Supplement',
        manufacturer: 'VitaLife',
        price: 45.00,
        stock: 5,
        expiryDate: '2025-06-10',
        description: 'Immune system support'
    }
];

const OwnerInventory = () => {
    const { user } = useAuth();
    const isDev = process.env.NODE_ENV === 'development';
    const [medicines, setMedicines] = useState(isDev ? MOCK_MEDICINES : []);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [form] = Form.useForm();

    const canManageInventory = user?.operationalPermissions?.manageInventory;

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            // In production, fetch from API
            // const response = await pharmacyOwnerAPI.getMedicines();
            // setMedicines(response.data.data);

            // For now, use mock data
            if (isDev) {
                setMedicines(MOCK_MEDICINES);
            }
        } catch (error) {
            console.error('Fetch Medicines Error:', error);
            message.error('Failed to load medicines');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (!canManageInventory) {
            message.warning('Enable Inventory Operations in Settings to add medicines');
            return;
        }
        setEditingMedicine(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        if (!canManageInventory) {
            message.warning('Enable Inventory Operations in Settings to edit medicines');
            return;
        }
        setEditingMedicine(record);
        form.setFieldsValue({
            ...record,
            expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!canManageInventory) {
            message.warning('Enable Inventory Operations in Settings to delete medicines');
            return;
        }
        try {
            // In production, call API
            // await pharmacyOwnerAPI.deleteMedicine(id);

            // For mock data
            setMedicines(medicines.filter(med => med._id !== id));
            message.success('Medicine deleted successfully');
        } catch (error) {
            message.error('Failed to delete medicine');
        }
    };

    const onFinish = async (values) => {
        try {
            const medicineData = {
                ...values,
                expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null
            };

            if (editingMedicine) {
                // Update existing medicine
                const updatedMedicines = medicines.map(med =>
                    med._id === editingMedicine._id ? { ...med, ...medicineData } : med
                );
                setMedicines(updatedMedicines);
                message.success('Medicine updated successfully');
            } else {
                // Add new medicine
                const newMedicine = {
                    _id: `med-${Date.now()}`,
                    ...medicineData
                };
                setMedicines([...medicines, newMedicine]);
                message.success('Medicine added successfully');
            }

            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            message.error('Failed to save medicine');
        }
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { color: 'red', text: 'OUT OF STOCK' };
        if (stock < 50) return { color: 'orange', text: 'LOW STOCK' };
        return { color: 'green', text: 'IN STOCK' };
    };

    const columns = [
        {
            title: 'Medicine Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <Tag color="blue">{category}</Tag>
        },
        {
            title: 'Manufacturer',
            dataIndex: 'manufacturer',
            key: 'manufacturer',
        },
        {
            title: 'Price (ETB)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => <Text strong>{price.toFixed(2)}</Text>,
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
            render: (stock) => {
                const status = getStockStatus(stock);
                return <Tag color={status.color}>{stock} - {status.text}</Tag>;
            },
            sorter: (a, b) => a.stock - b.stock,
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => dayjs(date).format('MMM DD, YYYY')
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (text, record) => (
                <Space size="middle">
                    {canManageInventory ? (
                        <>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                                type="text"
                                size="small"
                            />
                            <Popconfirm
                                title="Delete this medicine?"
                                onConfirm={() => handleDelete(record._id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    type="text"
                                    size="small"
                                />
                            </Popconfirm>
                        </>
                    ) : (
                        <Tag icon={<LockOutlined />} color="default">View Only</Tag>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <Space size="middle" align="center">
                        <Title level={2} style={{ marginBottom: 0 }}>
                            <MedicineBoxOutlined /> Inventory Management
                        </Title>
                        {isDev && <Tag color="orange">Mock Data</Tag>}
                    </Space>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                            {canManageInventory
                                ? 'Manage your pharmacy inventory - Add, edit, or remove medicines.'
                                : 'View-only mode. Enable Inventory Operations in Settings to manage inventory.'}
                        </Text>
                    </div>
                </div>
                {canManageInventory && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={handleAdd}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Add New Medicine
                    </Button>
                )}
            </div>

            {!canManageInventory && (
                <Alert
                    message="View-Only Mode"
                    description="You are viewing inventory in read-only mode. To add, edit, or delete medicines, enable 'Inventory Operations' in Settings → Operational Access."
                    type="info"
                    showIcon
                    icon={<AlertOutlined />}
                    style={{ marginBottom: '24px' }}
                />
            )}

            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={medicines}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Medicine Name"
                                rules={[{ required: true, message: 'Please enter medicine name' }]}
                            >
                                <Input placeholder="e.g., Paracetamol 500mg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Category"
                                rules={[{ required: true, message: 'Please select category' }]}
                            >
                                <Select placeholder="Select category">
                                    <Option value="Pain Relief">Pain Relief</Option>
                                    <Option value="Antibiotic">Antibiotic</Option>
                                    <Option value="Supplement">Supplement</Option>
                                    <Option value="Cardiovascular">Cardiovascular</Option>
                                    <Option value="Diabetes">Diabetes</Option>
                                    <Option value="Other">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="manufacturer"
                                label="Manufacturer"
                                rules={[{ required: true, message: 'Please enter manufacturer' }]}
                            >
                                <Input placeholder="e.g., PharmaCorp" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="Price (ETB)"
                                rules={[{ required: true, message: 'Please enter price' }]}
                            >
                                <InputNumber
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0.00"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="stock"
                                label="Stock Quantity"
                                rules={[{ required: true, message: 'Please enter stock quantity' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="expiryDate"
                                label="Expiry Date"
                                rules={[{ required: true, message: 'Please select expiry date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} placeholder="Brief description of the medicine" />
                    </Form.Item>

                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default OwnerInventory;
