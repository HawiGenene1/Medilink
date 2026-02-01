import React, { useState, useEffect } from 'react';
import { medicinesAPI } from '../../../services/api/medicines';
import { Row, Col, Card, Typography, Button, Tag, Space, Tabs, InputNumber, Divider, Alert, Avatar } from 'antd';
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

    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const response = await medicinesAPI.getById(id);
                if (response.data && response.data.success) {
                    const m = response.data.data;
                    setMedicine({
                        id: m._id,
                        _id: m._id,
                        name: m.name,
                        genericName: m.genericName || m.name,
                        price: `${m.price?.basePrice || 0} ETB`,
                        priceValue: m.price?.basePrice,
                        prescriptionRequired: m.requiresPrescription,
                        category: m.category,
                        usage: m.description || 'No description available.',
                        dosage: 'Dosage instructions not specified.',
                        warnings: 'No specific warnings available.',
                        storage: 'Standard storage conditions apply.',
                        expiry: m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : 'N/A'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch medicine detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMedicine();
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    if (!medicine) return <div style={{ padding: '50px', textAlign: 'center' }}>Medicine not found</div>;

    const PharmaciesList = () => (
        <div className="pharmacies-tab-list">
            {[
                { name: 'Kenema Pharmacy', distance: '0.5 km', price: '120 ETB', rating: 4.8, available: true },
                { name: 'Abyssinia Pharmacy', distance: '1.2 km', price: '125 ETB', rating: 4.5, available: true },
                { name: 'Red Cross Pharmacy', distance: '2.5 km', price: '118 ETB', rating: 4.9, available: false },
            ].map((ph, idx) => (
                <div key={idx} className="pharmacy-row">
                    <Row justify="space-between" align="middle" gutter={16}>
                        <Col flex="auto">
                            <Space size="middle">
                                <Avatar shape="square" icon={<ShopOutlined />} style={{ color: '#1E88E5', background: '#E3F2FD' }} />
                                <div>
                                    <Text strong>{ph.name}</Text>
                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                        <Space split={<span>•</span>}>
                                            <span>⭐ {ph.rating}</span>
                                            <span>{ph.distance} away</span>
                                        </Space>
                                    </div>
                                </div>
                            </Space>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <Text strong style={{ color: '#1E88E5', fontSize: '16px' }}>{ph.price}</Text>
                            </div>
                            <Button size="small" type={ph.available ? "primary" : "default"} disabled={!ph.available}>
                                {ph.available ? 'Select' : 'Out of Stock'}
                            </Button>
                        </Col>
                    </Row>
                </div>
            ))}
        </div>
    );

    const tabsItems = [
        {
            key: '1',
            label: 'Overview',
            children: (
                <div className="detail-tab-pane">
                    <Title level={5}>Clinical Indication</Title>
                    <Paragraph type="secondary">{medicine.usage}</Paragraph>
                    <Title level={5}>Category</Title>
                    <Tag>{medicine.category}</Tag>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Usage & Dosage',
            children: (
                <div className="detail-tab-pane">
                    <Title level={5}>Instructions</Title>
                    <Paragraph type="secondary">{medicine.dosage}</Paragraph>
                    <Space size="large" style={{ marginTop: '16px' }}>
                        <div><Text type="secondary">Storage:</Text><br /><Text strong>{medicine.storage}</Text></div>
                        <div><Text type="secondary">Expiry:</Text><br /><Text strong>{medicine.expiry}</Text></div>
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
                    <Card className="medicine-main-detail-card" variant="borderless">
                        <Row gutter={32}>
                            <Col xs={24} md={8}>
                                <div className="product-image-container">
                                    <MedicineBoxOutlined style={{ fontSize: '80px', color: '#1E88E5' }} />
                                </div>
                            </Col>
                            <Col xs={24} md={16}>
                                <div className="product-header-info">
                                    <div style={{ marginBottom: '12px' }}>
                                        {medicine.prescriptionRequired && (
                                            <Tag icon={<SafetyCertificateOutlined />} color="error">Prescription Required</Tag>
                                        )}
                                        <Tag icon={<CheckCircleOutlined />} color="success">Verified Product</Tag>
                                    </div>
                                    <Title level={2} style={{ margin: 0 }}>{medicine.name}</Title>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary" style={{ fontSize: '16px' }}>{medicine.genericName}</Text>
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
                                <Title level={2} style={{ margin: 0, color: '#1E88E5' }}>{medicine.price}</Title>
                                <Text type="secondary">ETB</Text>
                            </div>
                        </div>

                        <Divider />

                        <div className="quantity-selector-box">
                            <Text strong>Quantity</Text>
                            <InputNumber
                                min={1}
                                max={10}
                                value={quantity}
                                onChange={setQuantity}
                                className="clinical-input-number"
                            />
                        </div>

                        <div className="total-preview-row">
                            <Text>Order Total:</Text>
                            <Text strong style={{ fontSize: '18px' }}>{120 * quantity} ETB</Text>
                        </div>

                        {medicine.prescriptionRequired ? (
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
                                disabled={medicine.prescriptionRequired && !rxUploaded}
                                onClick={() => {
                                    addToCart({ ...medicine, id }, quantity);
                                    navigate('/customer/checkout');
                                }}
                            >
                                {medicine.prescriptionRequired && !rxUploaded ? 'Upload Rx First' : 'Add to Cart'}
                            </Button>

                            <Button
                                size="large"
                                block
                                style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                                icon={<ArrowRightOutlined />}
                                disabled={medicine.prescriptionRequired && !rxUploaded}
                                onClick={() => {
                                    addToCart({ ...medicine, id }, quantity);
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
