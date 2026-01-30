import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Tag, Space, Tabs, InputNumber, Divider, Alert, Avatar, Spin, Empty, notification } from 'antd';
import api from '../../../services/api';
import {
    ShoppingCartOutlined,
    MedicineBoxOutlined,
    ArrowLeftOutlined,
    ShopOutlined,
    InfoCircleOutlined,
    SafetyCertificateOutlined,
    FieldTimeOutlined,
    StarFilled,
    UploadOutlined,
    CheckCircleOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { HeartOutlined, HeartFilled, FlashOnOutlined } from '@ant-design/icons';
import { useCart } from '../../../contexts/CartContext';
import { useFavorites } from '../../../contexts/FavoritesContext';
import './MedicineDetail.css';

const { Title, Text, Paragraph } = Typography;

const MedicineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [quantity, setQuantity] = useState(1);
    const [rxUploaded, setRxUploaded] = useState(false);
    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMedicine = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/medicines/${id}`);
                setMedicine(response.data.data);
            } catch (err) {
                console.error('Error fetching medicine details:', err);
                setError('Failed to load medicine details.');
            } finally {
                setLoading(false);
            }
        };
        fetchMedicine();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon style={{ margin: '24px' }} />;
    if (!medicine) return <Empty description="Medicine not found" style={{ margin: '48px' }} />;

    const PharmaciesList = () => (
        <div className="pharmacies-tab-list">
            {medicine.pharmacy ? (
                <div className="pharmacy-row">
                    <Row justify="space-between" align="middle" gutter={16}>
                        <Col flex="auto">
                            <Space size="middle">
                                <Avatar shape="square" icon={<ShopOutlined />} style={{ color: '#1E88E5', background: '#E3F2FD' }} />
                                <div>
                                    <Text strong>{medicine.pharmacy.name}</Text>
                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                        <Space split={<span>•</span>}>
                                            <span>⭐ {medicine.pharmacy.rating || 4.5}</span>
                                            <span>{medicine.pharmacy.address?.city || 'Addis Ababa'}</span>
                                        </Space>
                                    </div>
                                </div>
                            </Space>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <Text strong style={{ color: '#1E88E5', fontSize: '16px' }}>{medicine.price.toFixed(2)} ETB</Text>
                            </div>
                            <Button size="small" type={medicine.quantity > 0 ? "primary" : "default"} disabled={medicine.quantity <= 0}>
                                {medicine.quantity > 0 ? 'Select' : 'Out of Stock'}
                            </Button>
                        </Col>
                    </Row>
                </div>
            ) : (
                <Empty description="No pharmacy information available" />
            )}
        </div>
    );

    const tabsItems = [
        {
            key: '1',
            label: 'Overview',
            children: (
                <div className="detail-tab-pane">
                    <Title level={5}>Description</Title>
                    <Paragraph type="secondary">{medicine.description}</Paragraph>
                    <Title level={5}>Category</Title>
                    <Tag>{medicine.category?.name || medicine.category || 'General'}</Tag>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Usage & Dosage',
            children: (
                <div className="detail-tab-pane">
                    <Title level={5}>Instructions</Title>
                    <Paragraph type="secondary">{medicine.usageInstructions || medicine.dosage}</Paragraph>
                    <Space size="large" style={{ marginTop: '16px' }}>
                        <div><Text type="secondary">Storage:</Text><br /><Text strong>{medicine.storageConditions?.temperature || medicine.storage}</Text></div>
                        <div><Text type="secondary">Expiry:</Text><br /><Text strong>{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : medicine.expiry}</Text></div>
                    </Space>
                </div>
            ),
        },
        {
            key: '3',
            label: 'Safety Warnings',
            children: (
                <div className="detail-tab-pane warning-pane">
                    <Alert
                        message="Precautions"
                        description={medicine.warnings}
                        type="warning"
                        showIcon
                    />
                    <div style={{ marginTop: '20px' }}>
                        <Title level={5}>Contraindications</Title>
                        <Paragraph type="secondary">• Renal Impairment (consult doctor)<br />• Pregnancy (Category B)<br />• Breastfeeding (with caution)</Paragraph>
                    </div>
                </div>
            ),
        },
        {
            key: '4',
            label: 'Available At',
            children: <PharmaciesList />,
        },
    ];

    return (
        <div className="medicine-detail-container fade-in">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ marginBottom: '24px' }}
            >
                Back to search
            </Button>

            <Row gutter={[40, 40]}>
                {/* Product Section */}
                <Col xs={24} lg={15}>
                    <Card className="medicine-main-detail-card" bordered={false}>
                        <Row gutter={32}>
                            <Col xs={24} md={8}>
                                <div className="product-image-container">
                                    <Avatar shape="square" size={160} src={(medicine.images && medicine.images[0]) || medicine.imageUrl} icon={<MedicineBoxOutlined style={{ fontSize: '80px', color: '#1E88E5' }} />} />
                                </div>
                            </Col>
                            <Col xs={24} md={16}>
                                <div className="product-header-info">
                                    <div style={{ marginBottom: '12px' }}>
                                        {medicine.requiresPrescription && (
                                            <Tag icon={<SafetyCertificateOutlined />} color="error">Prescription Required</Tag>
                                        )}
                                        <Tag icon={<CheckCircleOutlined />} color="success">Verified Product</Tag>
                                    </div>
                                    <Title level={2} style={{ margin: 0 }}>{medicine.name}</Title>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary" style={{ fontSize: '16px' }}>{medicine.genericName || medicine.brand}</Text>
                                        <Button
                                            type="text"
                                            icon={isFavorite(id) ? <HeartFilled style={{ color: '#F44336' }} /> : <HeartOutlined />}
                                            onClick={() => toggleFavorite({ ...medicine, id })}
                                            style={{ fontSize: '20px' }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '24px' }}>
                                        <Space size="large">
                                            <div className="product-quick-stat">
                                                <FieldTimeOutlined />
                                                <Text type="secondary">Fast Delivery (30-60m)</Text>
                                            </div>
                                            <div className="product-quick-stat">
                                                <StarFilled style={{ color: '#FFB300' }} />
                                                <Text strong>4.8 (120 reviews)</Text>
                                            </div>
                                        </Space>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '32px 0' }} />

                        <div className="medicine-tabs-wrapper">
                            <Tabs defaultActiveKey="1" items={tabsItems} className="clinical-tabs" />
                        </div>
                    </Card>
                </Col>

                {/* Purchase Panel (Sticky) */}
                <Col xs={24} lg={9}>
                    <Card className="purchase-action-panel sticky-panel">
                        <div className="panel-pricing">
                            <Text type="secondary">Price per unit</Text>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <Title level={2} style={{ margin: 0, color: '#1E88E5' }}>
                                    {(medicine.price || 0).toFixed(2)}
                                </Title>
                                <Text type="secondary">ETB</Text>
                            </div>
                        </div>

                        <Divider />

                        <div className="quantity-selector-box">
                            <Text strong>Quantity</Text>
                            <InputNumber
                                min={1}
                                max={medicine.quantity || 1}
                                value={quantity}
                                onChange={setQuantity}
                                className="clinical-input-number"
                            />
                        </div>

                        <div className="total-preview-row">
                            <Text>Order Total:</Text>
                            <Text strong style={{ fontSize: '18px' }}>
                                {((medicine.price || 0) * quantity).toFixed(2)} ETB
                            </Text>
                        </div>

                        {medicine.requiresPrescription ? (
                            <div className="rx-upload-section">
                                <Button
                                    block
                                    icon={<UploadOutlined />}
                                    className="upload-rx-btn"
                                    type={rxUploaded ? "default" : "primary"}
                                    onClick={() => setRxUploaded(true)}
                                >
                                    {rxUploaded ? 'Prescription Uploaded ✅' : 'Upload Prescription'}
                                </Button>
                                <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                                    Required for bacterial medications and hormones.
                                </Paragraph>
                            </div>
                        ) : null}

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<ShoppingCartOutlined />}
                                className="add-to-cart-btn"
                                disabled={medicine.requiresPrescription && !rxUploaded}
                                onClick={() => {
                                    addToCart({ ...medicine, id: medicine._id, priceValue: medicine.price, pharmacyId: medicine.pharmacy?._id }, quantity, medicine.pharmacy?.name || 'Pharmacy');
                                    notification.success({ message: 'Added to cart' });
                                }}
                            >
                                {medicine.requiresPrescription && !rxUploaded ? 'Upload Rx First' : 'Add to Cart'}
                            </Button>

                            <Button
                                size="large"
                                block
                                style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                                icon={<ArrowRightOutlined />}
                                disabled={medicine.requiresPrescription && !rxUploaded}
                                onClick={() => {
                                    addToCart({ ...medicine, id: medicine._id, priceValue: medicine.price, pharmacyId: medicine.pharmacy?._id }, quantity, medicine.pharmacy?.name || 'Pharmacy');
                                    navigate('/customer/checkout');
                                }}
                            >
                                Buy Now
                            </Button>
                        </Space>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <Space size="small">
                                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
                                <Text type="secondary" style={{ fontSize: '12px' }}>Secure clinical transaction</Text>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MedicineDetail;
