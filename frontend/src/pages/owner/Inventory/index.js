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
    Divider,
    Avatar,
    Statistic
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    MedicineBoxOutlined,
    SearchOutlined,
    CalendarOutlined,
    StockOutlined,
    PictureOutlined,
    WarningOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    InfoCircleOutlined,
    FilterOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI, medicinesAPI } from '../../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Derived stats
    const stats = {
        totalItems: medicines.length,
        totalStock: medicines.reduce((acc, m) => acc + (m.quantity || 0), 0),
        lowStock: medicines.filter(m => m.quantity <= m.reorderLevel).length,
        expiringSoon: medicines.filter(m => {
            if (!m.expiryDate) return false;
            const threeMonths = dayjs().add(3, 'month');
            return dayjs(m.expiryDate).isBefore(threeMonths) && dayjs(m.expiryDate).isAfter(dayjs());
        }).length,
        totalValuation: medicines.reduce((acc, m) => acc + ((m.quantity || 0) * (m.sellingPrice || 0)), 0)
    };

    // Permissions check: Staff always have access if they are on the page. 
    // Owners have strict permission-based access (Oversight Mode toggle).
    const role = user?.role?.toLowerCase();
    const isStaff = ['staff', 'pharmacist', 'technician', 'cashier', 'assistant', 'pharmacy_staff'].includes(role);
    const canManageInventory = isStaff || (role === 'pharmacy_owner' && user?.operationalPermissions?.manageInventory !== false);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.get({ _t: Date.now() });
            if (response.data.success) {
                const data = response.data.data;
                setMedicines(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Fetch Inventory Error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to load inventory from server.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Removed handleAdd because it's now in AddInventory.js

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
                <Space>
                    <Avatar
                        src={record.medicine?.imageUrl}
                        icon={<MedicineBoxOutlined />}
                        shape="square"
                        size="large"
                        style={{ backgroundColor: '#f5f5f5', color: '#1890ff' }}
                    />
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.medicine?.name || 'Missing Name'}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.medicine?.manufacturer || 'Unknown Manufacturer'} {record.medicine?.strength && `(${record.medicine.strength})`}
                        </Text>
                    </Space>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: ['medicine', 'category'],
            key: 'category',
            render: (cat) => {
                const name = typeof cat === 'object' ? cat?.name : (typeof cat === 'string' ? cat : null);
                return <Tag color="blue">{name || 'Other'}</Tag>;
            }
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
                                expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
                                reorderLevel: record.reorderLevel || 0,
                                costPrice: record.costPrice || 0,
                                notes: record.notes || ''
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

    const filteredMedicines = medicines.filter(m => {
        const query = searchText.toLowerCase();
        const medicine = m.medicine || {};

        // Search match
        const matchesSearch = (medicine.name || '').toLowerCase().includes(query) ||
            (medicine.manufacturer || '').toLowerCase().includes(query) ||
            (medicine.brand || '').toLowerCase().includes(query);

        // Category match
        const catName = medicine.category?.name || (typeof medicine.category === 'string' ? medicine.category : '');
        const matchesCategory = filterCategory === 'all' || catName === filterCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
            <div style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#1890ff', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                                <MedicineBoxOutlined style={{ color: 'white' }} />
                            </div>
                            Inventory Command Center
                        </Title>
                        <Text type="secondary">Real-time overview and management of your pharmaceutical assets.</Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/owner/inventory/add')}
                            disabled={!canManageInventory}
                            size="large"
                            style={{ borderRadius: '8px', height: '48px', padding: '0 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)' }}
                        >
                            Add New Stock
                        </Button>
                    </Col>
                </Row>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} bodyStyle={{ padding: '16px 20px' }} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Total Products</Text>}
                            value={stats.totalItems}
                            prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                            <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                            <Text type="success">Live Catalog</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} bodyStyle={{ padding: '16px 20px' }} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Low Stock Alerts</Text>}
                            value={stats.lowStock}
                            valueStyle={{ color: stats.lowStock > 0 ? '#ff4d4f' : 'inherit' }}
                            prefix={<WarningOutlined style={{ color: stats.lowStock > 0 ? '#ff4d4f' : '#8c8c8c' }} />}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                            {stats.lowStock > 0 ? <Text type="danger">Needs immediate restock</Text> : <Text type="success">Healthy stock levels</Text>}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} bodyStyle={{ padding: '16px 20px' }} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Near Expiry</Text>}
                            value={stats.expiringSoon}
                            valueStyle={{ color: stats.expiringSoon > 0 ? '#faad14' : 'inherit' }}
                            prefix={<CalendarOutlined style={{ color: stats.expiringSoon > 0 ? '#faad14' : '#8c8c8c' }} />}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                            Within next 90 days
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} bodyStyle={{ padding: '16px 20px' }} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Inventory Value</Text>}
                            value={stats.totalValuation}
                            precision={0}
                            prefix={<Text style={{ fontSize: '16px', marginRight: 4, color: '#52c41a' }}>ETB</Text>}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                            <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                            Estimated asset value
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <Text strong style={{ fontSize: '16px' }}>Stock Ledger</Text>
                        <Space>
                            <Select
                                defaultValue="all"
                                style={{ width: 180, borderRadius: '8px' }}
                                onChange={setFilterCategory}
                                suffixIcon={<FilterOutlined />}
                            >
                                <Option value="all">All Categories</Option>
                                <Option value="Analgesics & Antipyretics">Analgesics & Antipyretics</Option>
                                <Option value="Antibiotics">Antibiotics</Option>
                                <Option value="Antihypertensives">Antihypertensives</Option>
                                <Option value="Antidiabetics">Antidiabetics</Option>
                                <Option value="Cardiovascular Drugs">Cardiovascular Drugs</Option>
                                <Option value="Respiratory Medicines">Respiratory Medicines</Option>
                                <Option value="Gastrointestinal Medicines">Gastrointestinal Medicines</Option>
                                <Option value="Vitamins & Supplements">Vitamins & Supplements</Option>
                                <Option value="Dermatological Products">Dermatological Products</Option>
                                <Option value="Others">Others</Option>
                            </Select>
                            <Input
                                placeholder="Search inventory..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 250, borderRadius: '8px' }}
                                allowClear
                            />
                        </Space>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredMedicines}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                    }}
                    className="custom-table"
                />
            </Card>

            {/* Modal for editing */}
            <Modal
                title="Update Inventory"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} prefix={<StockOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Reorder Level" name="reorderLevel">
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Expiry Date" name="expiryDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Cost Price" name="costPrice">
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="ETB" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true }]}>
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="ETB" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Internal Notes" name="notes">
                        <Input.TextArea rows={3} placeholder="Add any internal notes about this stock item..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: '8px', marginTop: '8px' }}>Update Record</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default InventoryPage;
