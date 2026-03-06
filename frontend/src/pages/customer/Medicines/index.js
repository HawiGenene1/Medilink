import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Button, List, Tag, Select, Space, Typography, Avatar, Tooltip, Empty, Spin, Divider, notification, Badge } from 'antd';
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
import './Medicines.css';

const { Title, Text } = Typography;
const { Option } = Select;

const MedicineSearch = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [viewMode, setViewMode] = useState('list');
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
                    categories: selectedCategory === 'all' ? undefined : selectedCategory,
                    limit: 50
                }
            });
            // The backend returns { success: true, data: [...], pagination: ... }
            setMedicines(response.data.data || []);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            notification.error({
                message: 'Connection issue',
                description: 'Failed to fetch the latest inventory. Please try again later.'
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

    return (
        <div className="medicines-container-premium fade-in-premium" style={{ padding: '0 0 40px 0' }}>

            {/* Header & Controls */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Find Real Inventory</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>Searching across 50+ registered pharmacies in Addis Ababa, including <b>Kenema Pharmacy</b>.</Text>

                <Row gutter={[20, 20]} style={{ marginTop: '28px' }}>
                    <Col xs={24} md={14}>
                        <Input
                            size="large"
                            placeholder="Search by medicine name or pharmacy (e.g. Kenema)..."
                            prefix={<SearchOutlined style={{ color: 'var(--primary-color)' }} />}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="search-input-premium"
                        />
                    </Col>
                    <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Select
                            defaultValue="all"
                            size="large"
                            style={{ width: '100%', maxWidth: '240px' }}
                            onChange={setSelectedCategory}
                            className="category-select-premium"
                        >
                            <Option value="all">All Medicine Types</Option>
                            <Option value="Analgesics & Antipyretics">Pain & Fever Relievers</Option>
                            <Option value="Antibiotics">Antibiotics</Option>
                            <Option value="Antihypertensives">Blood Pressure</Option>
                            <Option value="Antidiabetics">Diabetes Care</Option>
                            <Option value="Vitamins & Supplements">Wellness & Vitamins</Option>
                            <Option value="Others">General Items</Option>
                        </Select>
                    </Col>
                </Row>
            </div>

            {/* Content Area */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" tip="Scanning pharmacies..." />
                </div>
            ) : medicines.length > 0 ? (
                <List
                    grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
                    dataSource={medicines}
                    renderItem={item => (
                        <List.Item>
                            <Card
                                hoverable
                                className="item-card-premium"
                                bodyStyle={{ padding: '20px' }}
                                actions={[
                                    <Button key="details" type="text" size="small" icon={<MedicineBoxOutlined />} onClick={() => navigate(`/customer/medicines/${item._id}`)}>Details</Button>,
                                    <Button key="add" type="primary" size="small" className="btn-cart-modern" icon={<ShoppingCartOutlined />} onClick={() => addToCart({ ...item, id: String(item._id), inventoryId: item.inventoryId, rxStatus: item.prescriptionId ? 'uploaded' : undefined }, 1, item.pharmacy?._id, item.pharmacy?.name || 'Pharmacy')}>Add to Cart</Button>
                                ]}
                            >
                                <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                    <div className="medicine-image-container">
                                        <Avatar shape="square" size={80} src={(item.images && item.images[0]) || item.imageUrl || 'https://via.placeholder.com/80?text=MED'} icon={<MedicineBoxOutlined />} style={{ borderRadius: '12px' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ maxWidth: '85%' }}>
                                                <Text strong style={{ fontSize: '16px', color: 'var(--text-main)', display: 'block' }}>{item.name}</Text>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>{item.brand || item.manufacturer}</Text>
                                            </div>
                                            <Button
                                                type="text"
                                                icon={isFavorite(String(item._id)) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                                onClick={() => toggleFavorite({ ...item, id: String(item._id) })}
                                                size="small"
                                                className="favorite-btn"
                                            />
                                        </div>

                                        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <Text style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Best Price</Text>
                                                <Text strong style={{ fontSize: '18px', color: 'var(--primary-color)' }}>
                                                    {parseFloat(item.price || 0).toLocaleString()} ETB
                                                </Text>
                                            </div>
                                            <Tag color={item.prescriptionRequired ? "error" : "success"} style={{ borderRadius: '4px', margin: 0, fontSize: '10px' }}>
                                                {item.prescriptionRequired ? "PRESCRIPTION" : "OTC"}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>

                                <Divider style={{ margin: '16px 0' }} />

                                <div style={{ background: 'var(--bg-soft)', padding: '10px', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShopOutlined style={{ color: 'var(--primary-color)' }} />
                                            <Text strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.pharmacy?.name}</Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>{item.distance || 'nearby'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space size={4}>
                                            <Badge status={item.quantity > 0 ? "success" : "error"} />
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {item.quantity > 0 ? `${item.quantity} units in stock` : 'Out of stock'}
                                            </Text>
                                        </Space>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            <EnvironmentOutlined style={{ fontSize: '10px', marginRight: '4px' }} />
                                            {item.pharmacy?.address?.city || 'Addis Ababa'}
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            No medicines found matching your search. <br />
                            Try searching for a different name or pharmacy like <b>"Kenema"</b>.
                        </span>
                    }
                />
            )}
        </div>
    );
};

export default MedicineSearch;
