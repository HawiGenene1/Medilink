
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap'; // Keep Container for layout or replace with div
import { Input, Select, Button, Card, Spin, Badge, Tag, Space, Typography } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './MedicineList.css'; // Ensure this file exists or styles are handled

const { Search } = Input;
const { Option } = Select;
const { Meta } = Card;
const { Title, Text } = Typography;

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'name',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.sort) params.append('sort', filters.sort);

        // Mock data for development if API fails or is empty (Optional: remove in production)
        // const response = await api.get(`/medicines?${params.toString()}`);
        // setMedicines(response.data);

        // TEMPORARY: Attempt fetch, fallback to empty array or handle error
        // const response = await api.get(`/medicines?${params.toString()}`);
        // setMedicines(response.data);

        // Simple mock for UI dev
        setTimeout(() => {
          setMedicines([
            { _id: '1', name: 'Paracetamol', manufacturer: 'EthioPharm', description: 'Pain reliever and fever reducer.', price: 50, imageUrl: '', category: 'otc', stock: 100 },
            { _id: '2', name: 'Amoxicillin', manufacturer: 'Cadila', description: 'Antibiotic for bacterial infections.', price: 120, imageUrl: '', category: 'prescription', stock: 50 },
            { _id: '3', name: 'Vitamin C', manufacturer: 'SunPharma', description: 'Immune system booster.', price: 200, imageUrl: '', category: 'supplement', stock: 0 },
          ]);
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Error fetching medicines:', error);
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [filters]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, category: value }));
  };

  return (
    <div className="medicine-list-page" style={{ padding: '24px' }}>
      <div className="container">
        <Title level={2} style={{ marginBottom: '24px' }}>Browse Medicines</Title>

        {/* Search and Filter Section */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={12} md={6}>
              <Search
                placeholder="Search by name, manufacturer, etc."
                allowClear
                enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
                size="large"
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={6} md={3}>
              <Select
                placeholder="Select Category"
                style={{ width: '100%' }}
                size="large"
                onChange={handleCategoryChange}
                allowClear
              >
                <Option value="prescription">Prescription</Option>
                <Option value="otc">Over the Counter</Option>
                <Option value="supplement">Supplements</Option>
                <Option value="equipment">Medical Equipment</Option>
              </Select>
            </Col>
            <Col xs={6} md={3} style={{ textAlign: 'right' }}>
              {/* Placeholder for Add Medicine (Admin/Staff only) - hidden for public */}
            </Col>
          </Row>
        </Card>

        {/* Medicine Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading medicines..." />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {medicines.map(medicine => (
              <Col xs={24} sm={12} md={8} lg={6} key={medicine._id} style={{ marginBottom: '24px' }}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={medicine.name}
                      src={medicine.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Link to={`/medicines/${medicine._id}`} key="view">
                      <Button type="link">View Details</Button>
                    </Link>,
                    <Button type="primary" icon={<ShoppingCartOutlined />} disabled={medicine.stock === 0} key="add">
                      Add
                    </Button>
                  ]}
                >
                  <Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{medicine.name}</span>
                        <Text type="success">${medicine.price}</Text>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{medicine.manufacturer}</Text>
                        <Space>
                          {medicine.category === 'prescription' && <Tag color="red">Prescription</Tag>}
                          {medicine.stock > 0 ? <Tag color="green">In Stock</Tag> : <Tag color="default">Out of Stock</Tag>}
                        </Space>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default MedicineList;