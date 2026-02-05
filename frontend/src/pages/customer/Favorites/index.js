import React from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Empty } from 'antd';
import {
    HeartFilled,
    ShoppingCartOutlined,
    MedicineBoxOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    ShopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../../contexts/FavoritesContext';
import { useCart } from '../../../contexts/CartContext';
import './Favorites.css';

const { Title, Text } = Typography;

const Favorites = () => {
    const navigate = useNavigate();
    const { favorites, toggleFavorite } = useFavorites();
    const { addToCart } = useCart();

    const handleAddToCart = (medicine) => {
        addToCart(medicine, 1, medicine.pharmacy?._id, medicine.pharmacy?.name || 'Pharmacy');
    };

    return (
        <div className="favorites-container fade-in">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/customer/dashboard')}
                style={{ marginBottom: '24px' }}
            >
                Back to Dashboard
            </Button>

            <div className="favorites-header" style={{ marginBottom: '32px' }}>
                <Title level={2}>My Favorites</Title>
                <Text type="secondary">Saved medicines for quick access and reordering</Text>
            </div>

            {favorites.length === 0 ? (
                <Card className="empty-favorites-card">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Space direction="vertical">
                                <Text type="secondary">No favorites saved yet</Text>
                                <Button type="primary" onClick={() => navigate('/customer/medicines')}>
                                    Browse Medicines
                                </Button>
                            </Space>
                        }
                    />
                </Card>
            ) : (
                <Row gutter={[24, 24]}>
                    <Col xs={24}>
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                            dataSource={favorites}
                            renderItem={(medicine) => (
                                <List.Item>
                                    <Card
                                        className="favorite-medicine-card"
                                        hoverable
                                        cover={
                                            <div className="fav-card-cover" onClick={() => navigate(`/customer/medicines/${medicine.id}`)}>
                                                <MedicineBoxOutlined style={{ fontSize: '48px', color: '#1E88E5' }} />
                                                <Button
                                                    className="fav-toggle-btn"
                                                    shape="circle"
                                                    icon={<HeartFilled style={{ color: '#F44336' }} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(medicine);
                                                    }}
                                                />
                                            </div>
                                        }
                                        actions={[
                                            <Button
                                                type="text"
                                                icon={<ShoppingCartOutlined />}
                                                onClick={() => handleAddToCart(medicine)}
                                            >
                                                Add to Cart
                                            </Button>,
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => toggleFavorite(medicine)}
                                            >
                                                Remove
                                            </Button>
                                        ]}
                                    >
                                        <Card.Meta
                                            title={<Text strong onClick={() => navigate(`/customer/medicines/${medicine.id}`)}>{medicine.name}</Text>}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{medicine.category}</Text>
                                                    <Text strong style={{ color: '#1E88E5', marginTop: '8px', display: 'block' }}>{medicine.price}</Text>
                                                </Space>
                                            }
                                        />
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default Favorites;
