import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Typography, Space, Row, Col, Avatar, Tag, Divider, Alert, Modal, Upload, message } from 'antd';
import {
    ArrowLeftOutlined,
    SendOutlined,
    PhoneOutlined,
    MessageOutlined,
    CheckCircleFilled,
    ClockCircleOutlined,
    CameraOutlined,
    EnvironmentOutlined,
    CarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryDetails.css';

const { Title, Text } = Typography;

const DeliveryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Delivery States
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('assigned');
    const [isNear, setIsNear] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);

    // Map States
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const courierMarkerRef = useRef(null);
    const [courierPos, setCourierPos] = useState(null);
    const [destPos, setDestPos] = useState(null);
    const [pickupPos, setPickupPos] = useState(null);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            // Re-using common order fetch or creating a specific one?
            // Since we need to be authorized as delivery, let's assuming /api/orders/:id works or we created a specific one.
            // Actually, let's use the public/protected order endpoint if available, but we need full details.
            // deliveryController.getActiveDeliveries gave us a list. 
            // We might not have a specific 'get single delivery details' in deliveryController yet.
            // But we can use the generic order endpoint if it allows the courier to view it.
            // For now, let's assume we can fetch it via /api/orders/:id if we are the courier.
            const response = await api.get(`/orders/${id}`);
            console.log('[DeliveryDetails] API Response:', response.data);
            if (response.data.success) {
                const data = response.data.data;
                console.log('[DeliveryDetails] Order data:', data);
                console.log('[DeliveryDetails] Address:', data.address);
                console.log('[DeliveryDetails] Address label:', data.address?.label);
                setOrder(data);
                setStatus(data.status);

                // Set Positions from customer delivery address
                if (data.address?.geojson?.coordinates) {
                    // GeoJSON format: [longitude, latitude]
                    setDestPos([data.address.geojson.coordinates[1], data.address.geojson.coordinates[0]]);
                } else if (data.address?.coordinates) {
                    setDestPos([data.address.coordinates.latitude, data.address.coordinates.longitude]);
                }
                if (data.pharmacy?.location?.coordinates) {
                    // GeoJSON is [lng, lat]
                    setPickupPos([data.pharmacy.location.coordinates[1], data.pharmacy.location.coordinates[0]]);
                }
                // Courier Pos - ideally get from current location or backend
                // For now, default to pickup or a known start point if waiting
                navigator.geolocation.getCurrentPosition(pos => {
                    setCourierPos([pos.coords.latitude, pos.coords.longitude]);
                }, () => {
                    // Fallback
                    setCourierPos([9.0227, 38.7460]);
                });
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            message.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!loading && mapRef.current && !mapInstance.current && courierPos) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(courierPos, 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

            // Courier Marker
            courierMarkerRef.current = L.marker(courierPos, {
                icon: L.divIcon({
                    className: 'courier-pin',
                    html: '<div style="font-size: 24px;">🚗</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(mapInstance.current);

            // Pickup Marker
            if (pickupPos) {
                L.marker(pickupPos, {
                    icon: L.divIcon({
                        className: 'pickup-marker',
                        html: '🏥',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(mapInstance.current).bindPopup('Pharmacy (Pickup)');
            }

            // Dropoff Marker
            if (destPos) {
                L.marker(destPos, {
                    icon: L.divIcon({
                        className: 'destination-marker',
                        html: '📍',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    })
                }).addTo(mapInstance.current).bindPopup('Customer (Dropoff)');
            }

            // Fit bounds
            const bounds = L.latLngBounds([courierPos]);
            if (pickupPos) bounds.extend(pickupPos);
            if (destPos) bounds.extend(destPos);
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [loading, courierPos, pickupPos, destPos]);

    const handleAction = async () => {
        try {
            if (status === 'confirmed' || status === 'ready' || status === 'preparing' || status === 'pending') {
                // Confirm Pickup
                await api.put('/delivery/pickup', { orderId: id });
                setStatus('in_transit');
                message.success('Delivery Started');
            } else if (status === 'in_transit') {
                setShowProofModal(true);
            }
        } catch (error) {
            message.error('Action failed');
        }
    };

    const handleProofSubmit = async () => {
        try {
            await api.put('/delivery/complete', { orderId: id });
            setStatus('delivered');
            message.success('Delivery Completed Successfully');
            setShowProofModal(false);
            setTimeout(() => navigate('/delivery/dashboard'), 2000);
        } catch (error) {
            message.error('Failed to complete delivery');
        }
    };

    const getButtonText = () => {
        if (status === 'pending') return 'Start Pickup from Pharmacy';
        if (status === 'confirmed' || status === 'ready' || status === 'preparing') return 'Confirm Medicine Pickup';
        if (status === 'in_transit') return 'Complete Delivery';
        if (status === 'delivered') return 'Delivery Completed';
        return 'Process Order';
    };

    return (
        <div className="delivery-details-container">
            {isNear && status === 'in_transit' && (
                <div className="arrival-banner">
                    <Alert
                        message="You've Arrived!"
                        description="You are within 50m of the customer. Please confirm delivery."
                        type="info"
                        showIcon
                        action={
                            <Button size="small" type="primary" onClick={() => setShowProofModal(true)}>
                                Complete Now
                            </Button>
                        }
                    />
                </div>
            )}

            <Button
                icon={<ArrowLeftOutlined />}
                className="floating-back-btn"
                onClick={() => navigate('/delivery/dashboard')}
            >
                Tasks
            </Button>

            <div className="delivery-map-wrapper" ref={mapRef}>
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    className="delivery-nav-btn"
                />
            </div>

            <div className="delivery-info-sheet">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', display: 'inline-block' }}></div>
                </div>

                <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>#{id || '882'}</Title>
                        <Text type="secondary"><ClockCircleOutlined /> Assigned 12 mins ago</Text>
                    </Col>
                    <Col>
                        <Tag color={status === 'delivered' ? 'success' : 'blue'} style={{ borderRadius: '12px', padding: '4px 12px' }}>
                            {status.toUpperCase().replace('_', ' ')}
                        </Tag>
                    </Col>
                </Row>

                <div className="action-card">
                    <Row align="middle" gutter={16}>
                        <Col>
                            <Avatar size={48} src="https://i.pravatar.cc/150?u=customer" />
                        </Col>
                        <Col flex="auto">
                            <Text strong block>{order?.customer?.firstName || order?.customer?.name || 'Customer'} {order?.customer?.lastName || ''}</Text>
                            <Text type="secondary" style={{ fontSize: '13px' }}>{order?.address?.label || 'Delivery location'}</Text>
                        </Col>
                        <Col>
                            <Space>
                                <Button shape="circle" icon={<PhoneOutlined />} />
                                <Button shape="circle" icon={<MessageOutlined />} type="primary" ghost />
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Card bordered={false} bodyStyle={{ padding: '12px 0' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <EnvironmentOutlined style={{ color: '#1E88E5', marginTop: '4px' }} />
                            <div>
                                <Text strong block>Delivery Address</Text>
                                <Text type="secondary">{order?.address?.label || 'Address not available'}</Text>
                            </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <CheckCircleFilled style={{ color: '#43A047', marginTop: '4px' }} />
                            <div>
                                <Text strong block>Pharmacy Pickup</Text>
                                <Text type="secondary">{order?.pharmacy?.name}</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {typeof order?.pharmacy?.address === 'object'
                                        ? `${order.pharmacy.address.street}, ${order.pharmacy.address.city}`
                                        : (order?.pharmacy?.address || 'Address not available')}
                                </Text>
                            </div>
                        </div>
                    </Space>
                </Card>

                <div style={{ marginTop: '24px' }}>
                    <Button
                        type="primary"
                        block
                        size="large"
                        className="primary-action-btn"
                        onClick={handleAction}
                        disabled={status === 'delivered' || loading}
                    >
                        {getButtonText()}
                    </Button>
                </div>
            </div>

            <Modal
                title="Proof of Delivery"
                open={showProofModal}
                onCancel={() => setShowProofModal(false)}
                onOk={handleProofSubmit}
                okText="Submit & Complete"
                okButtonProps={{ className: 'confirm-location-btn' }}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Upload.Dragger>
                        <p className="ant-upload-drag-icon">
                            <CameraOutlined />
                        </p>
                        <p className="ant-upload-text">Take a photo of the delivery</p>
                        <p className="ant-upload-hint">Ensure the package and house number are visible.</p>
                    </Upload.Dragger>

                    <div style={{ marginTop: '16px', textAlign: 'left' }}>
                        <Text strong>Recipient Signature</Text>
                        <div style={{ height: '100px', border: '1px dashed #d9d9d9', borderRadius: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#bfbfbf' }}>
                            Sign here on arrival
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DeliveryDetails;
