import React, { useState, useEffect } from 'react';
import { medicinesAPI } from '../../../services/api/medicines';
import { Row, Col, Card, Input, Button, List, Tag, Select, Space, Typography, Avatar, Tooltip, Empty } from 'antd';
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

const { Title, Text } = Typography;
const { Option } = Select;

const MedicineSearch = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [searchQuery, setSearchQuery] = useState('');

    const MOCK_MEDICINES = [
        {
            id: 'mock-1',
            name: 'Amoxicillin 500mg',
            pharmacy: 'Kenema Pharmacy',
            price: '150 ETB',
            distance: '0.5 km',
            stock: 'In Stock',
            location: { lat: 9.0320, lng: 38.7469 },
            image: 'https://via.placeholder.com/64?text=AMX'
        },
        {
            id: 'mock-2',
            name: 'Paracetamol 500mg',
            pharmacy: 'City Pharma',
            price: '45 ETB',
            distance: '1.2 km',
            stock: 'In Stock',
            location: { lat: 9.0300, lng: 38.7500 },
            image: 'https://via.placeholder.com/64?text=PCM'
        },
        {
            id: 'mock-3',
            name: 'Vitamin C 1000mg',
            pharmacy: 'Red Cross Store',
            price: '85 ETB',
            distance: '2.1 km',
            stock: 'Limited',
            location: { lat: 9.0350, lng: 38.7550 },
            image: 'https://via.placeholder.com/64?text=VIT'
        }
    ];

    const [medicines, setMedicines] = useState(MOCK_MEDICINES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const response = await medicinesAPI.list();
                if (response.data && response.data.success) {
                    const realMedicines = response.data.data.map(m => ({
                        id: m._id,
                        name: m.name,
                        pharmacy: m.availableAt?.[0]?.name || 'Local Pharmacy',
                        price: `${m.price?.basePrice || 0} ETB`,
                        priceValue: m.price?.basePrice,
                        distance: 'Nearby',
                        stock: m.stockQuantity > 0 ? 'In Stock' : 'Out of Stock',
                        image: 'https://via.placeholder.com/64?text=MED',
                        realId: m._id
                    }));
                    setMedicines([...realMedicines, ...MOCK_MEDICINES]);
                }
            } catch (error) {
                console.error("Failed to fetch medicines", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMedicines();
    }, []);

    const filteredMedicines = medicines.filter(m =>
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.pharmacy || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <Select defaultValue="all" size="large" style={{ width: 150 }}>
                            <Option value="all">All Categories</Option>
                            <Option value="prescription">Prescription</Option>
                            <Option value="otc">OTC</Option>
                        </Select>
                        <div style={{ background: '#fff', padding: '4px', borderRadius: '8px', border: '1px solid #d9d9d9', display: 'flex' }}>
                            <Button
                                type={viewMode === 'list' ? 'primary' : 'text'}
                                icon={<UnorderedListOutlined />}
                                onClick={() => setViewMode('list')}
                            >
                                List
                            </Button>
                            <Button
                                type={viewMode === 'map' ? 'primary' : 'text'}
                                icon={<EnvironmentOutlined />}
                                onClick={() => setViewMode('map')}
                            >
                                Map
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Content Area */}
            {viewMode === 'list' ? (
                <List
                    grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                    dataSource={filteredMedicines}
                    renderItem={item => (
                        <List.Item>
                            <Card
                                hoverable
                                bodyStyle={{ padding: '24px' }}
                                actions={[
                                    <Tooltip title="View Details"><Button type="text" icon={<MedicineBoxOutlined />} onClick={() => navigate(`/customer/medicines/${item.id}`)}>Details</Button></Tooltip>,
                                    <Tooltip title="Add to Cart"><Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => addToCart({ ...item, id: String(item.id) }, 1, item.pharmacy)}>Add</Button></Tooltip>
                                ]}
                            >
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <Avatar shape="square" size={64} src={item.image} icon={<MedicineBoxOutlined />} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text strong style={{ fontSize: '16px', display: 'block' }}>{item.name}</Text>
                                            <Button
                                                type="text"
                                                icon={isFavorite(String(item.id)) ? <HeartFilled style={{ color: '#F44336' }} /> : <HeartOutlined />}
                                                onClick={() => toggleFavorite({ ...item, id: String(item.id) })}
                                                size="small"
                                            />
                                        </div>
                                        <Tag color="blue" style={{ marginTop: '4px' }}>{item.pharmacy}</Tag>

                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong style={{ fontSize: '18px', color: '#4361ee' }}>{item.price}</Text>
                                            <Space size={4}>
                                                <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                                                <Text type="secondary">{item.distance}</Text>
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <Tag color={item.stock === 'In Stock' ? 'success' : 'warning'}>{item.stock}</Tag>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Open until 9:00 PM</Text>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                /* Mock Map View */
                <Card bodyStyle={{ padding: 0, height: '600px', position: 'relative', overflow: 'hidden', background: '#e6f7ff' }}>
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column'
                    }}>
                        <EnvironmentOutlined style={{ fontSize: '64px', color: '#4361ee', marginBottom: '16px' }} />
                        <Title level={4} style={{ color: '#4361ee' }}>Interactive Map View</Title>
                        <Text type="secondary">Map integration would appear here showing pharmacy pins.</Text>

                        {/* Mock Pins */}
                        <div style={{ position: 'absolute', top: '30%', left: '40%', textAlign: 'center' }}>
                            <EnvironmentOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
                            <div style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '12px', fontWeight: 'bold' }}>Kenema</div>
                        </div>
                        <div style={{ position: 'absolute', top: '60%', left: '70%', textAlign: 'center' }}>
                            <EnvironmentOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
                            <div style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '12px', fontWeight: 'bold' }}>City Pharma</div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default MedicineSearch;
