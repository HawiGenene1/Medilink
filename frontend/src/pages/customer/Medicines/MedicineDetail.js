import React, { useState, useEffect } from 'react';
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
    ArrowRightOutlined,
    InboxOutlined,
    FileProtectOutlined,
    HeartOutlined,
    HeartFilled
} from '@ant-design/icons';
import { getPrescriptions, uploadPrescription } from '../../../services/api/prescriptions';
import {
    Modal, List, Upload, notification, Input, Typography,
    Button, Space, Avatar, Tag, Alert, Tabs, Spin, Empty,
    Row, Col, Card, Divider, InputNumber
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useFavorites } from '../../../contexts/FavoritesContext';
import api from '../../../services/api';
import './MedicineDetail.css';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const AntdTabs = Tabs;

const MedicineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [quantity, setQuantity] = useState(1);
    const [selectedRx, setSelectedRx] = useState(null);
    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Prescription Modal State
    const [isRxModalVisible, setIsRxModalVisible] = useState(false);
    const [userPrescriptions, setUserPrescriptions] = useState([]);
    const [loadingRx, setLoadingRx] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [uploadingRx, setUploadingRx] = useState(false);
    const [rxNotes, setRxNotes] = useState('');

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

    const fetchUserPrescriptions = async () => {
        setLoadingRx(true);
        try {
            const response = await getPrescriptions({ status: 'approved' });
            if (response.success) {
                setUserPrescriptions(response.data.prescriptions);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoadingRx(false);
        }
    };

    const handleUploadRx = async () => {
        if (fileList.length === 0) return;
        setUploadingRx(true);
        const formData = new FormData();
        formData.append('prescription', fileList[0]);
        formData.append('notes', rxNotes);

        try {
            const response = await uploadPrescription(formData);
            if (response.success) {
                notification.success({ message: 'Rx Uploaded', description: 'Your prescription is pending review.' });
                setSelectedRx({
                    id: response.data.prescriptionId,
                    url: response.data.imageUrl,
                    isNew: true
                });
                setIsRxModalVisible(false);
                setFileList([]);
                setRxNotes('');
            }
        } catch (error) {
            notification.error({ message: 'Upload Failed', description: 'Please try again.' });
        } finally {
            setUploadingRx(false);
        }
    };


    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon style={{ margin: '24px' }} />;
    if (!medicine) return <Empty description="Medicine not found" style={{ margin: '48px' }} />;


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
            children: (
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
            ),
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
                                    type={selectedRx ? "default" : "primary"}
                                    onClick={() => {
                                        setIsRxModalVisible(true);
                                        fetchUserPrescriptions();
                                    }}
                                >
                                    {selectedRx ? 'Rx Attached ✓' : 'Attach Prescription'}
                                </Button>
                                {selectedRx && (
                                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                        <Text type="success" style={{ fontSize: '12px' }}>
                                            <CheckCircleOutlined /> Prescription {selectedRx.isNew ? 'uploaded' : 'selected'}
                                        </Text>
                                    </div>
                                )}
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
                                disabled={medicine.requiresPrescription && !selectedRx}
                                onClick={() => {
                                    addToCart({
                                        ...medicine,
                                        id: medicine._id,
                                        priceValue: medicine.price,
                                        prescriptionId: selectedRx?.id,
                                        prescriptionImage: selectedRx?.url
                                    }, quantity, medicine.pharmacy?._id, medicine.pharmacy?.name || 'Pharmacy');
                                    notification.success({ message: 'Added to cart' });
                                }}
                            >
                                {medicine.requiresPrescription && !selectedRx ? 'Attach Rx First' : 'Add to Cart'}
                            </Button>

                            <Button
                                size="large"
                                block
                                style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                                icon={<ArrowRightOutlined />}
                                disabled={medicine.requiresPrescription && !selectedRx}
                                onClick={() => {
                                    addToCart({
                                        ...medicine,
                                        id: medicine._id,
                                        priceValue: medicine.price,
                                        prescriptionId: selectedRx?.id,
                                        prescriptionImage: selectedRx?.url
                                    }, quantity, medicine.pharmacy?._id, medicine.pharmacy?.name || 'Pharmacy');
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
            <Modal
                title="Medical Prescription Required"
                open={isRxModalVisible}
                onCancel={() => setIsRxModalVisible(false)}
                footer={null}
                width={700}
            >
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab="Select Existing" key="1">
                        <List
                            loading={loadingRx}
                            dataSource={userPrescriptions}
                            renderItem={rx => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type={selectedRx?.id === rx._id ? "primary" : "default"}
                                            onClick={() => {
                                                setSelectedRx({ id: rx._id, url: rx.imageUrl, isNew: false });
                                                setIsRxModalVisible(false);
                                            }}
                                        >
                                            {selectedRx?.id === rx._id ? 'Selected' : 'Select'}
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<FileProtectOutlined />} style={{ background: '#E3F2FD', color: '#1E88E5' }} />}
                                        title={rx.originalName}
                                        description={`Uploaded on ${new Date(rx.uploadedAt).toLocaleDateString()}`}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <div style={{ padding: '20px', textAlign: 'center' }}><Text type="secondary">No approved prescriptions found.</Text></div> }}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Upload New" key="2">
                        <div style={{ padding: '10px 0' }}>
                            <Dragger
                                multiple={false}
                                fileList={fileList}
                                beforeUpload={file => {
                                    setFileList([file]);
                                    return false;
                                }}
                                onRemove={() => setFileList([])}
                            >
                                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                <p className="ant-upload-text">Click or drag prescription image to this area</p>
                            </Dragger>
                            <Input.TextArea
                                rows={3}
                                placeholder="Additional notes for the pharmacist..."
                                style={{ marginTop: '16px' }}
                                value={rxNotes}
                                onChange={e => setRxNotes(e.target.value)}
                            />
                            <Button
                                type="primary"
                                block
                                style={{ marginTop: '20px' }}
                                onClick={handleUploadRx}
                                loading={uploadingRx}
                                disabled={fileList.length === 0}
                            >
                                Upload RX
                            </Button>
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Modal>
        </div>
    );
};

export default MedicineDetail;
