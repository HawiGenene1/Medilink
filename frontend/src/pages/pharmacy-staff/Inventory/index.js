import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, InputNumber, Select, message, Popconfirm, Tooltip, Row, Col, Card, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { medicinesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const { user, loading: authLoading } = useAuth();

  const fetchMedicines = useCallback(async () => {
    if (!user?.pharmacyId) return;
    try {
      setLoading(true);
      const response = await medicinesAPI.getAll({ pharmacyId: user.pharmacyId });
      if (response.data.success) {
        const formattedData = response.data.data.map(med => ({
          key: med._id,
          id: med._id,
          name: med.name,
          brand: med.brand || 'N/A',
          category: med.category,
          stock: med.quantity,
          price: med.price,
          expiry: med.expiryDate ? dayjs(med.expiryDate).format('YYYY-MM-DD') : 'N/A',
          status: med.quantity === 0 ? 'Out of Stock' : (med.quantity < 20 ? 'Low Stock' : 'In Stock'),
          description: med.description
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      message.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [user?.pharmacyId]);

  useEffect(() => {
    if (user?.pharmacyId) {
      fetchMedicines();
    }
  }, [user, fetchMedicines]);

  // Handle Add/Edit
  const handleAddStart = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditStart = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      expiry: record.expiry !== 'N/A' ? record.expiry : null
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await medicinesAPI.delete(id);
      if (response.data.success) {
        message.success('Medicine deleted successfully');
        fetchMedicines();
      }
    } catch (error) {
      console.error('Failed to delete medicine:', error);
      message.error('Failed to delete medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        price: values.price,
        stockQuantity: values.stock,
        expiryDate: values.expiry,
        pharmacy: user.pharmacyId
      };

      if (editingItem) {
        const response = await medicinesAPI.update(editingItem.id, payload);
        if (response.data.success) {
          message.success('Medicine updated successfully!');
        }
      } else {
        const response = await medicinesAPI.add(payload);
        if (response.data.success) {
          message.success('Medicine added successfully!');
        }
      }
      setIsModalVisible(false);
      fetchMedicines();
    } catch (error) {
      console.error('Failed to save medicine:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save medicine';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase()) || record.brand.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Pain Relief', value: 'Pain Relief' },
        { text: 'Antibiotics', value: 'Antibiotics' },
        { text: 'Supplements', value: 'Supplements' }
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <Tag color={stock > 20 ? 'green' : (stock > 0 ? 'orange' : 'red')}>
          {stock}
        </Tag>
      )
    },
    {
      title: 'Price (ETB)',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (price) => `ETB ${price}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'Low Stock') color = 'orange';
        if (status === 'Out of Stock') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => handleEditStart(record)} />
          </Tooltip>
          <Popconfirm title="Are you sure delete this medicine?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter Logic
  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchText.toLowerCase()) ||
    item.category.toLowerCase().includes(searchText.toLowerCase())
  );

  if (authLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading Inventory..." /></div>;
  }

  return (
    <div className="inventory-page">
      <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <h2>Inventory Management</h2>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchMedicines} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStart}>Add Medicine</Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Search by medicine name or brand..."
          allowClear
          onSearch={setSearchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </Card>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingItem ? "Edit Medicine" : "Add New Medicine"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ stock: 0, price: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Medicine Name" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Paracetamol" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Brand Name" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Panadol" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select Category">
                  <Option value="otc">Over-the-Counter (OTC)</Option>
                  <Option value="prescription">Prescription</Option>
                  <Option value="supplement">Supplement</Option>
                  <Option value="herbal">Herbal</Option>
                  <Option value="medical_device">Medical Device</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dosageForm" label="Physical Form" rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select Form">
                  <Option value="tablet">Tablet</Option>
                  <Option value="capsule">Capsule</Option>
                  <Option value="syrup">Syrup</Option>
                  <Option value="injection">Injection</Option>
                  <Option value="cream">Cream</Option>
                  <Option value="ointment">Ointment</Option>
                  <Option value="drops">Drops</Option>
                  <Option value="inhaler">Inhaler</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="strength" label="Strength" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. 500mg, 10mg/ml" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="packSize" label="Pack Size" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Box of 30, 200ml Bottle" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expiry" label="Expiry Date" rules={[{ required: true, message: 'Required' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requiresPrescription" label="Prescription Required?" initialValue={false}>
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stock" label="Stock Quantity" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minStockLevel" label="Min Level" initialValue={10} rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Price (ETB)" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={0} prefix="ETB" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;
