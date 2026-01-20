import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Progress } from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    EnvironmentOutlined,
    UploadOutlined,
    ShopOutlined,
    ClockCircleOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MedilinkSkeleton from '../../../components/ui/MedilinkSkeleton';
import './Dashboard.css';

const { Title, Text } = Typography;

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    // Mock Data for Search Results
    const searchResults = searchQuery ? [
        {
            id: 'med-1',
            name: 'Paracetamol 500mg',
            genericName: 'Acetaminophen',
            prescriptionRequired: false,
            category: 'Pain Relief',
            pharmacies: [
                { id: 'ph-1', name: 'Kenema Pharmacy', rating: 4.8, distance: '0.5 km', price: '45 ETB', available: true },
                { id: 'ph-2', name: 'Abyssinia Pharma', rating: 4.5, distance: '1.2 km', price: '48 ETB', available: true },
                { id: 'ph-3', name: 'Red Cross', rating: 4.9, distance: '2.5 km', price: '42 ETB', available: false },
            ]
        },
        {
            id: 'med-2',
            name: 'Amoxicillin 250mg',
            genericName: 'Amoxicillin',
            prescriptionRequired: true,
            category: 'Antibiotics',
            pharmacies: [
                { id: 'ph-1', name: 'Kenema Pharmacy', rating: 4.8, distance: '0.5 km', price: '120 ETB', available: true },
            ]
        }
    ] : [];

    // Mock Data for Dashboard
    const stats = {
        activeOrders: 3,
        processing: 2,
        delivery: 1,
    };

    const recentOrders = [
        {
            id: '#ORD-1024',
            pharmacy: 'City Pharmacy',
            amount: '450 ETB',
            status: 'In Delivery',
            progress: 75,
            date: 'Today, 2:30 PM'
        },
        {
            id: '#ORD-1023',
            pharmacy: 'Red Cross Pharmacy',
            amount: '1200 ETB',
            status: 'Processing',
            progress: 40,
            date: 'Today, 10:15 AM'
        },
    ];

    const nearbyPharmacies = [
        { name: 'Kenema Pharmacy', distance: '0.5 km', status: 'Open', rating: 4.8 },
        { name: 'Abyssinia Pharma', distance: '1.2 km', status: 'Open', rating: 4.5 },
        { name: 'Bethel Pharmacy', distance: '1.8 km', status: 'Open', rating: 4.7 },
    ];

    const quickActions = [
        {
            title: 'Search Medicine',
            icon: <SearchOutlined />,
            color: '#1E88E5',
            bgColor: 'rgba(30, 136, 229, 0.1)',
            action: () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.focus();
            }
        },
        {
            title: 'Upload Prescription',
            icon: <UploadOutlined />,
            color: '#43A047',
            bgColor: 'rgba(67, 160, 71, 0.1)',
            action: () => navigate('/customer/prescriptions')
        },
        {
            title: 'My Cart',
            icon: <ShoppingCartOutlined />,
            color: '#FFB300',
            bgColor: 'rgba(255, 179, 0, 0.1)',
            action: () => navigate('/customer/cart')
        },
        {
            title: 'Nearby Pharmacies',
            icon: <EnvironmentOutlined />,
            color: '#E53935',
            bgColor: 'rgba(229, 57, 53, 0.1)',
            action: () => navigate('/customer/pharmacies')
        },
    ];

    // Medicine Card Component
    const MedicineResultCard = ({ medicine }) => (
        <Card className="medicine-search-card" style={{ marginBottom: '20px' }}>
            <Row justify="space-between" align="top">
                <Col>
                    <Space direction="vertical" size={2}>
                        <Title level={4} style={{ margin: 0 }}>{medicine.name}</Title>
                        <Text type="secondary" style={{ fontSize: '13px' }}>{medicine.genericName}</Text>
                        <Space style={{ marginTop: '8px' }}>
                            {medicine.prescriptionRequired && (
                                <Tag color="error" className="medicine-badge">Rx Required</Tag>
                            )}
                            <Tag className="category-tag">{medicine.category}</Tag>
                        </Space>
                    </Space>
                </Col>
                <Col>
                    <Button type="primary" onClick={() => navigate(`/customer/medicines/${medicine.id}`)}>
                        View Details
                    </Button>
                </Col>
            </Row>

            <div className="expanded-pharmacy-list" style={{ marginTop: '20px' }}>
                <Text strong style={{ display: 'block', marginBottom: '16px' }}>Available at {medicine.pharmacies.length} Pharmacies:</Text>
                {medicine.pharmacies.map(ph => (
                    <div key={ph.id} className="pharmacy-search-item" style={{ borderTop: '1px solid #f0f0f0', padding: '12px 0' }}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Space size="middle">
                                    <Avatar shape="square" icon={<ShopOutlined />} style={{ background: 'white', color: '#1E88E5' }} />
                                    <div>
                                        <Text strong>{ph.name}</Text>
                                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                            <Space split={<span>•</span>}>
                                                <span>⭐ {ph.rating}</span>
                                                <span>📍 {ph.distance}</span>
                                            </Space>
                                        </div>
                                    </div>
                                </Space>
                            </Col>
                            <Col style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <Text strong style={{ color: '#1E88E5', fontSize: '16px' }}>{ph.price}</Text>
                                    <Tag
                                        color={ph.available ? "success" : "default"}
                                        style={{ marginLeft: '12px' }}
                                    >
                                        {ph.available ? 'In Stock' : 'Out of Stock'}
                                    </Tag>
                                </div>
                                <Space>
                                    <Button size="small">View</Button>
                                    <Button size="small" type="primary" disabled={!ph.available}>Add to Cart</Button>
                                </Space>
                            </Col>
                        </Row>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <div className="customer-dashboard-full">
            {searchQuery ? (
                <div className="search-results-section fade-in">
                    <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                        <Col>
                            <Title level={3} style={{ margin: 0 }}>Results for "{searchQuery}"</Title>
                            <Text type="secondary">Found {searchResults.length} medicines</Text>
                        </Col>
                        <Col>
                            <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
                        </Col>
                    </Row>
                    {searchResults.map(med => <MedicineResultCard key={med.id} medicine={med} />)}
                </div>
            ) : viewMode === 'map' ? (
                <div className="map-view-section fade-in">
                    <div className="map-list-toggle" style={{ marginBottom: '20px' }}>
                        <Button type="primary" onClick={() => setViewMode('list')}>Switch to List View</Button>
                    </div>
                    <div className="map-list-container">
                        <div className="list-side">
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                <Title level={4} style={{ margin: 0 }}>Nearby Pharmacies</Title>
                                <Text type="secondary">Sorted by distance</Text>
                            </div>
                            <List
                                dataSource={nearbyPharmacies}
                                renderItem={item => (
                                    <List.Item style={{ padding: '20px' }}>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<EnvironmentOutlined />} style={{ background: 'rgba(67, 160, 71, 0.1)', color: '#43A047' }} />}
                                            title={<Text strong>{item.name}</Text>}
                                            description={
                                                <Space size="small">
                                                    <span>📍 {item.distance}</span>
                                                    <Tag color="success">Open</Tag>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                        <div className="map-side">
                            <div className="map-placeholder">
                                <Space direction="vertical" align="center">
                                    <EnvironmentOutlined style={{ fontSize: '48px', color: '#CBD5E1' }} />
                                    <Text type="secondary">Interactive Map View Coming Soon</Text>
                                    <Text style={{ fontSize: '12px', color: '#94A3B8' }}>Leaflet.js integration in progress</Text>
                                </Space>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="default-dashboard fade-in">
                    <div className="welcome-section" style={{ marginBottom: '32px' }}>
                        <Title level={2} style={{ marginBottom: '8px' }}>Welcome back! 👋</Title>
                        <Text type="secondary" style={{ fontSize: '16px' }}>Find medicines or pharmacies near you</Text>
                    </div>

                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} md={12}>
                            <Card className="stats-banner-mini" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                <Space size="large">
                                    <div className="banner-stat">
                                        <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Active Orders</Text>
                                        <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>{stats.activeOrders}</Title>
                                    </div>
                                    <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                                    <div className="banner-stat">
                                        <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Delivery</Text>
                                        <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>{stats.delivery}</Title>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <div className="section-title" style={{ marginBottom: '20px', fontWeight: 600, fontSize: '18px' }}>Quick Actions</div>
                    <Row gutter={[16, 16]} style={{ marginBottom: '40px' }}>
                        {quickActions.map((action, index) => (
                            <Col xs={12} md={6} key={index}>
                                <Card className="quick-action-card-refined" hoverable onClick={action.action}>
                                    <div className="action-icon-refined" style={{ background: action.bgColor, color: action.color, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{action.icon}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong>{action.title}</Text>
                                        <RightOutlined style={{ fontSize: '12px', color: '#94A3B8' }} />
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={14}>
                            <Card title={<Title level={4} style={{ margin: 0 }}>Recent Orders</Title>} extra={<Button type="link" onClick={() => navigate('/customer/orders')}>View All</Button>}>
                                <List itemLayout="horizontal" dataSource={recentOrders} renderItem={item => (
                                    <List.Item actions={[<Button type="primary" size="small" key="track" onClick={() => navigate('/customer/orders')}>Track</Button>]}>
                                        <List.Item.Meta
                                            avatar={<Avatar shape="square" size={48} icon={<ShopOutlined />} style={{ background: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }} />}
                                            title={<Text strong>{item.pharmacy}</Text>}
                                            description={
                                                <div>
                                                    <Space size="small">
                                                        <Text type="secondary">{item.date}</Text>
                                                        <Text strong>{item.amount}</Text>
                                                    </Space>
                                                    <Progress percent={item.progress} size="small" showInfo={false} strokeColor="#1E88E5" style={{ marginTop: '8px' }} />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.status}</Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )} />
                            </Card>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Card title={<Title level={4} style={{ margin: 0 }}>Nearby Pharmacies</Title>} extra={<Button type="link" onClick={() => setViewMode('map')}>Map View</Button>}>
                                <List itemLayout="horizontal" dataSource={nearbyPharmacies} renderItem={item => (
                                    <List.Item actions={[<Button type="text" icon={<RightOutlined />} size="small" key="go" />]}>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<EnvironmentOutlined />} style={{ background: 'rgba(67, 160, 71, 0.1)', color: '#43A047' }} />}
                                            title={<Text strong>{item.name}</Text>}
                                            description={<Space size="small"><Text type="secondary">{item.distance}</Text><Tag color="success">{item.status}</Tag></Space>}
                                        />
                                    </List.Item>
                                )} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
