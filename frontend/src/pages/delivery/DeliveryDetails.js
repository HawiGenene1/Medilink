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
    const courierCircleRef = useRef(null);
    const pickupMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const routeLineRef = useRef(null);
    const [courierPos, setCourierPos] = useState(null);
    const [courierAccuracy, setCourierAccuracy] = useState(null);
    const [destPos, setDestPos] = useState(null);
    const [pickupPos, setPickupPos] = useState(null);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    // Initialize Map Once
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            const initialPos = courierPos || [9.0227, 38.7460];
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(initialPos, 17);

            // Layers
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'ESRI World Imagery'
            }).addTo(mapInstance.current);

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                opacity: 0.8
            }).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                courierMarkerRef.current = null;
                courierCircleRef.current = null;
                pickupMarkerRef.current = null;
                destMarkerRef.current = null;
            }
        };
    }, []);

    // Update Markers when positions change
    useEffect(() => {
        if (!mapInstance.current) return;

        const markers = [];

        // 1. Courier Marker
        if (courierPos) {
            if (courierMarkerRef.current) {
                courierMarkerRef.current.setLatLng(courierPos);
            } else {
                courierMarkerRef.current = L.marker(courierPos, {
                    icon: L.divIcon({
                        className: 'courier-pin',
                        html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>',
                        iconSize: [35, 35],
                        iconAnchor: [17, 17]
                    })
                }).addTo(mapInstance.current);
            }
            markers.push(courierPos);
        }

        // 2. Pickup Marker
        if (pickupPos) {
            if (pickupMarkerRef.current) {
                pickupMarkerRef.current.setLatLng(pickupPos);
            } else {
                pickupMarkerRef.current = L.marker(pickupPos, {
                    icon: L.divIcon({
                        className: 'pickup-marker',
                        html: '<div style="font-size: 28px;">🏥</div>',
                        iconSize: [35, 35],
                        iconAnchor: [17, 17]
                    })
                }).addTo(mapInstance.current).bindPopup('Pharmacy (Pickup)');
            }
            markers.push(pickupPos);
        }

        // 3. Dropoff Marker
        if (destPos) {
            if (destMarkerRef.current) {
                destMarkerRef.current.setLatLng(destPos);
            } else {
                destMarkerRef.current = L.marker(destPos, {
                    icon: L.divIcon({
                        className: 'destination-marker',
                        html: '<div style="font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">📍</div>',
                        iconSize: [40, 40],
                        iconAnchor: [20, 35]
                    })
                }).addTo(mapInstance.current).bindPopup('Customer (Dropoff)');
            }
            markers.push(destPos);
        }

        // Fit bounds once when data is available
        if (!loading && markers.length > 1) {
            const bounds = L.latLngBounds(markers);
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }

        // 4. Accuracy Circle
        if (courierPos && courierAccuracy) {
            if (courierCircleRef.current) {
                courierCircleRef.current.setLatLng(courierPos);
                courierCircleRef.current.setRadius(courierAccuracy);
            } else {
                courierCircleRef.current = L.circle(courierPos, {
                    radius: courierAccuracy,
                    color: '#1E88E5',
                    fillColor: '#1E88E5',
                    fillOpacity: 0.1,
                    weight: 1
                }).addTo(mapInstance.current);
            }
        }

        // 5. Route Line (Pharmacy to Customer)
        if (pickupPos && destPos) {
            if (routeLineRef.current) {
                routeLineRef.current.setLatLngs([pickupPos, destPos]);
            } else {
                routeLineRef.current = L.polyline([pickupPos, destPos], {
                    color: 'white',
                    weight: 4,
                    dashArray: '10, 15',
                    opacity: 0.6,
                    lineJoin: 'round'
                }).addTo(mapInstance.current);
            }
        }
    }, [loading, courierPos, courierAccuracy, pickupPos, destPos]);

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get(`/orders/${id}`);
            if (response.data.success) {
                const data = response.data.data;
                setOrder(data);
                setStatus(data.status);

                // Set Positions
                if (data.address?.geojson?.coordinates) {
                    setDestPos([data.address.geojson.coordinates[1], data.address.geojson.coordinates[0]]);
                } else if (data.address?.coordinates) {
                    setDestPos([data.address.coordinates.latitude, data.address.coordinates.longitude]);
                }

                if (data.pharmacy?.location?.coordinates) {
                    setPickupPos([data.pharmacy.location.coordinates[1], data.pharmacy.location.coordinates[0]]);
                }

                // Courier Pos - use high accuracy
                navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    setCourierPos([latitude, longitude]);
                    setCourierAccuracy(accuracy);
                }, () => {
                    setCourierPos([9.0227, 38.7460]);
                    setCourierAccuracy(null);
                }, { enableHighAccuracy: true });
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            message.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

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

    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (showProofModal && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
        }
    }, [showProofModal]);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleProofSubmit = async () => {
        try {
            const canvas = canvasRef.current;
            const signature = canvas.toDataURL('image/png');
            
            await api.put('/delivery/complete', { 
                orderId: id,
                signature: signature 
            });
            
            setStatus('delivered');
            message.success('Delivery Completed Successfully');
            setShowProofModal(false);
            setTimeout(() => navigate('/delivery/dashboard'), 2000);
        } catch (error) {
            message.error('Failed to complete delivery');
        }
    };

    const handleOpenNavigation = () => {
        let destination = null;
        if (status === 'in_transit') {
            destination = destPos;
        } else {
            destination = pickupPos;
        }

        if (destination) {
            const [lat, lng] = destination;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            window.open(url, '_blank');
        } else {
            message.warning('Destination coordinates not found');
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
                    onClick={handleOpenNavigation}
                />
            </div>

            <div className="delivery-info-sheet">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', display: 'inline-block' }}></div>
                </div>

                <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>#{order?.orderNumber?.split('-').pop() || '882'}</Title>
                        <Text type="secondary"><ClockCircleOutlined /> Assigned {new Date(order?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
                            <Avatar size={48} src={`https://ui-avatars.com/api/?name=${order?.customer?.firstName || 'C'}&background=1E88E5&color=fff`} />
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
                                        ? `${order.pharmacy.address.street || ''}, ${order.pharmacy.address.city || ''}`
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
                <div style={{ padding: '0 0' }}>
                    <Text strong>Recipient Signature</Text>
                    <div className="signature-pad-container">
                        <canvas
                            ref={canvasRef}
                            className="signature-canvas"
                            width={450}
                            height={180}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        <div className="signature-actions">
                            <Button size="small" onClick={clearSignature}>Clear</Button>
                        </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                        Customer must sign here to confirm receipt of medical items.
                    </Text>
                </div>
            </Modal>
        </div>
    );
};

export default DeliveryDetails;
