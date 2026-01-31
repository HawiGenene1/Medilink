import React, { useState, useEffect, useCallback } from 'react';
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
    Row,
    Col,
    Divider
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    MedicineBoxOutlined,
    SearchOutlined,
    CalendarOutlined,
    StockOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { inventoryAPI, medicinesAPI } from '../../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryPage = () => {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [form] = Form.useForm();
    const [addForm] = Form.useForm();
    const [catalogResults, setCatalogResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);

    // Permissions check
    const canManageInventory = user?.role === 'PHARMACY_OWNER' || user?.operationalPermissions?.manageInventory;

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.get();
            if (response.data.success) {
                setMedicines(response.data.data);
            }
        } catch (error) {
            console.error('Fetch Inventory Error:', error);
            message.error('Failed to load inventory from server.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSearchCatalog = async (value) => {
        if (!value || value.length < 2) return;
        try {
            setSearchLoading(true);
            const res = await medicinesAPI.search(value);
            if (res.data.success) {
                setCatalogResults(res.data.data);
            }
        } catch (error) {
            message.error('Error searching catalog');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAdd = async (values) => {
        try {
            const payload = { ...values };
            if (values.expiryDate) payload.expiryDate = values.expiryDate.format('YYYY-MM-DD');

            const res = await inventoryAPI.add(payload);
            if (res.data.success) {
                message.success('Medicine added to inventory');
                setIsAddModalOpen(false);
                addForm.resetFields();
                setIsManualEntry(false);
                fetchInventory();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to add medicine');
        }
    };

    const handleUpdate = async (values) => {
        try {
            const payload = { ...values };
            if (values.expiryDate) payload.expiryDate = values.expiryDate.format('YYYY-MM-DD');

            const res = await inventoryAPI.update(editingMedicine._id, payload);
            if (res.data.success) {
                message.success('Inventory updated');
                setIsModalOpen(false);
                fetchInventory();
            }
        } catch (error) {
            message.error('Failed to update inventory');
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await inventoryAPI.delete(id);
            if (res.data.success) {
                message.success('Removed from inventory');
                fetchInventory();
            }
        } catch (error) {
            message.error('Failed to remove item');
        }
    };

    const columns = [
        {
            title: 'Medicine',
            key: 'medicineName',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.medicine?.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.medicine?.manufacturer} {record.medicine?.strength && `(${record.medicine.strength})`}</Text>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: ['medicine', 'category'],
            key: 'category',
            render: (cat) => <Tag color="blue">{cat}</Tag>
        },
        {
            title: 'Price',
            dataIndex: 'sellingPrice',
            key: 'sellingPrice',
            render: (price) => <Text strong>{price} ETB</Text>
        },
        {
            title: 'Stock',
            key: 'stock',
            render: (_, record) => {
                const isLow = record.quantity <= record.reorderLevel;
                return (
                    <Space>
                        <Text type={isLow ? 'danger' : 'success'} strong>{record.quantity}</Text>
                        {isLow && <Tag color="error">LOW</Tag>}
                    </Space>
                );
            }
        },
        {
            title: 'Expiry',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => (
                <Space>
                    <CalendarOutlined style={{ color: dayjs(date).isBefore(dayjs().add(3, 'month')) ? 'red' : 'inherit' }} />
                    {date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'}
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingMedicine(record);
                            form.setFieldsValue({
                                ...record,
                                expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null
                            });
                            setIsModalOpen(true);
                        }}
                        disabled={!canManageInventory}
                    />
                    <Popconfirm title="Remove from inventory?" onConfirm={() => handleDelete(record._id)}>
                        <Button icon={<DeleteOutlined />} danger disabled={!canManageInventory} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ marginBottom: 0 }}>
                        <MedicineBoxOutlined /> Inventory Management
                    </Title>
                    <Text type="secondary">Monitor and manage your pharmacy's medical stock.</Text>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!canManageInventory}
                        size="large"
                    >
                        Add to Inventory
                    </Button>
                </Col>
            </Row>

            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={medicines}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                />
            </Card>

            {/* Modal for adding/lookup */}
            <Modal
                title="Add Medicine to Inventory"
                open={isAddModalOpen}
                onCancel={() => { setIsAddModalOpen(false); setIsManualEntry(false); }}
                footer={null}
                width={700}
            >
                <Form form={addForm} layout="vertical" onFinish={handleAdd}>
                    {!isManualEntry ? (
                        <>
                            <Form.Item label="Find in Global Catalog" name="medicineId" rules={[{ required: true }]}>
                                <Select
                                    showSearch
                                    placeholder="Type medicine name..."
                                    filterOption={false}
                                    onSearch={handleSearchCatalog}
                                    loading={searchLoading}
                                    suffixIcon={<SearchOutlined />}
                                >
                                    {catalogResults.map(m => (
                                        <Option key={m._id} value={m._id}>{m.name} - {m.manufacturer} ({m.strength})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Button type="link" onClick={() => setIsManualEntry(true)}>Can't find it? Click here to enter details manually</Button>
                        </>
                    ) : (
                        <>
                            <Divider>New Medicine Details</Divider>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Medicine Name" name="name" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Paracetamol" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Manufacturer" name="manufacturer" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. MedLife" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Category" name="category" rules={[{ required: true }]}>
                                        <Select placeholder="Select category">
                                            <Option value="Pain Relief">Pain Relief</Option>
                                            <Option value="Antibiotics">Antibiotics</Option>
                                            <Option value="Supplements">Supplements</Option>
                                            <Option value="Cardiovascular">Cardiovascular</Option>
                                            <Option value="Other">Other</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Strength/Dosage" name="strength">
                                        <Input placeholder="e.g. 500mg" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Button type="link" onClick={() => setIsManualEntry(false)}>Return to Search</Button>
                        </>
                    )}

                    <Divider>Stock & Pricing</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Initial Quantity" name="quantity" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Reorder Level" name="reorderLevel" initialValue={10}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Selling Price (ETB)" name="sellingPrice" rules={[{ required: true }]}>
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Expiry Date" name="expiryDate" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Batch Number" name="batchNumber">
                        <Input />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block size="large">Add to Inventory</Button>
                </Form>
            </Modal>

            {/* Modal for editing */}
            <Modal
                title="Update Inventory"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} prefix={<StockOutlined />} />
                    </Form.Item>
                    <Form.Item label="Expiry Date" name="expiryDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true }]}>
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>Update Record</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default InventoryPage;
