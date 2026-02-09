import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Button, List, Tag, Select, Space, Typography, Avatar, Tooltip, Empty, Spin, Divider, notification } from 'antd';
import {
    SearchOutlined,
    EnvironmentOutlined,
    UnorderedListOutlined,
    FilterOutlined,
    ShopOutlined,
    MedicineBoxOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useCart } from '../../../contexts/CartContext';
import { useFavorites } from '../../../contexts/FavoritesContext';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const MedicineSearch = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const response = await api.get('/medicines', {
                params: {
                    search: searchQuery,
                    categories: selectedCategory === 'all' ? undefined : selectedCategory
                }
            });
            setMedicines(response.data.data || []);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to fetch medicines. Please check your connection.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMedicines();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory]);

    const filteredMedicines = medicines;

    return (
        <div style={{ padding: '0 0 24px 0' }}>

            {/* Header & Controls */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Find Medicines</Title>
                <Text type="secondary">Search for medicines and see which nearby pharmacies have them in stock.</Text>

                <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col xs={24} md={12}>
                        <Input
                            size="large"
                            placeholder="Search medicine or pharmacy..."
                            prefix={<SearchOutlined />}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ borderRadius: '12px' }}
                        />
                    </Col>
                    <Col xs={24} md={12} style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <Select defaultValue="all" size="large" style={{ width: 180 }} onChange={setSelectedCategory}>
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
                    </Col>
                </Row>
            </div>

            {/* Content Area */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
            ) : viewMode === 'list' ? (
                <List
                    grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                    dataSource={filteredMedicines}
                    renderItem={item => (
                        <List.Item>
                            <Card
                                hoverable
                                bodyStyle={{ padding: '24px' }}
                                actions={[
                                    <Tooltip title="View Details"><Button type="text" icon={<MedicineBoxOutlined />} onClick={() => navigate(`/customer/medicines/${item._id}`)}>Details</Button></Tooltip>,
                                    <Tooltip title="Add to Cart"><Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => addToCart({ ...item, id: String(item._id) }, 1, item.pharmacy?._id, item.pharmacy?.name || 'Pharmacy')}>Add</Button></Tooltip>
                                ]}
                            >
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <Avatar shape="square" size={64} src={(item.images && item.images[0]) || item.image || 'https://via.placeholder.com/64?text=MED'} icon={<MedicineBoxOutlined />} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text strong style={{ fontSize: '16px', display: 'block' }}>{item.name}</Text>
                                            <Button
                                                type="text"
                                                icon={isFavorite(String(item._id)) ? <HeartFilled style={{ color: '#F44336' }} /> : <HeartOutlined />}
                                                onClick={() => toggleFavorite({ ...item, id: String(item._id) })}
                                                size="small"
                                            />
                                        </div>
                                        <Space split={<Divider type="vertical" />} style={{ marginTop: '4px' }}>
                                            <Tag color="blue">{item.manufacturer}</Tag>
                                            {item.pharmacy && (
                                                <Space size={4}>
                                                    <ShopOutlined style={{ color: '#1890ff' }} />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.pharmacy.name}</Text>
                                                </Space>
                                            )}
                                        </Space>

                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong style={{ fontSize: '18px', color: '#4361ee' }}>
                                                {(item.price?.basePrice || item.price || 0).toFixed(2)} ETB
                                            </Text>
                                            <Space size={4}>
                                                <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                                                <Text type="secondary">{item.distance || '0.0 km'}</Text>
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <Tag color={(item.quantity > 0) ? 'success' : 'warning'}>
                                        {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {item.pharmacy?.address?.city || 'Addis Ababa'}
                                    </Text>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty description="Map view not yet integrated with live datav" />
            )}
        </div>
    );
};

export default MedicineSearch;
