
import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, InputNumber, Select, message, Popconfirm, Tooltip, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Mock Data Fetch
  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = [
        { key: '1', id: '1', name: 'Paracetamol', brand: 'Panadol', category: 'Pain Relief', stock: 150, price: 50, expiry: '2025-12-01', status: 'In Stock' },
        { key: '2', id: '2', name: 'Amoxicillin', brand: 'Amoxil', category: 'Antibiotics', stock: 20, price: 120, expiry: '2024-05-15', status: 'Low Stock' },
        { key: '3', id: '3', name: 'Ibuprofen', brand: 'Advil', category: 'Pain Relief', stock: 0, price: 85, expiry: '2025-01-20', status: 'Out of Stock' },
        { key: '4', id: '4', name: 'Vitamin C', brand: 'CeeVit', category: 'Supplements', stock: 200, price: 15, expiry: '2026-03-10', status: 'In Stock' },
      ];
      setData(mockData);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    console.log("Inventory Component Mounted!");
    fetchData();
  }, []);

  // Handle Add/Edit
  const handleAddStart = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditStart = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    message.success('Item deleted successfully (Mock)');
    setData(data.filter(item => item.id !== id));
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      setLoading(true);
      setTimeout(() => {
        if (editingItem) {
          // Edit logic
          const newData = data.map(item => item.id === editingItem.id ? { ...item, ...values } : item);
          setData(newData);
          message.success('Medicine updated successfully!');
        } else {
          // Add logic
          const newItem = {
            key: Date.now().toString(),
            id: Date.now().toString(),
            ...values,
            status: values.stock > 10 ? 'In Stock' : (values.stock > 0 ? 'Low Stock' : 'Out of Stock') // Simple logic
          };
          setData([...data, newItem]);
          message.success('Medicine added successfully!');
        }
        setIsModalVisible(false);
        setLoading(false);
      }, 500);
    });
  };

  // Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Button type="link" style={{ padding: 0 }}>{text}</Button>,
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

  return (
    <div className="inventory-page">
      <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <h2>Inventory Management</h2>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
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
        dataSource={data}
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
                  <Option value="Pain Relief">Pain Relief</Option>
                  <Option value="Antibiotics">Antibiotics</Option>
                  <Option value="Supplements">Supplements</Option>
                  <Option value="Chronic Care">Chronic Care</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry" label="Expiry Date" rules={[{ required: true, message: 'Required' }]}>
                {/* Simplified as Input for now, should be DatePicker */}
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stock" label="Stock Quantity" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
