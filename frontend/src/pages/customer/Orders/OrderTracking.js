import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Timeline, Tag, Avatar, Space, Divider, Badge, Modal } from 'antd';
import {
    ArrowLeftOutlined,
    PhoneOutlined,
    MessageOutlined,
    ClockCircleOutlined,
    CheckCircleFilled,
    SendOutlined,
    UserOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ordersAPI } from '../../../services/api/orders';
import { useSocket } from '../../../contexts/SocketContext';
import { notification } from 'antd';
import './OrderTracking.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Title, Text } = Typography;

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const driverMarkerRef = useRef(null);
    const pharmacyMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);

    // Live Tracking State
    const [driverPos, setDriverPos] = useState([9.0227, 38.7460]); // Fallback pos

    const socket = useSocket();

    const fetchTracking = async () => {
        try {
            const response = await ordersAPI.getTracking(id);
            if (response.data?.success) {
                const tracking = response.data.data;
                setOrderData(tracking);
                if (tracking.courier?.location?.coordinates) {
                    const newPos = [
                        tracking.courier.location.coordinates[1], // lat
                        tracking.courier.location.coordinates[0]  // lng
                    ];
                    setDriverPos(newPos);

                    // Update Marker Position
                    if (driverMarkerRef.current) {
                        driverMarkerRef.current.setLatLng(newPos);
                    }
                }
                setLastSync(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error('Tracking update failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Socket.io Listener
    useEffect(() => {
        if (!socket) return;

        socket.emit('track_order', id);

        const handleLocationUpdate = (coords) => {
            // coords might be { latitude, longitude } or [lng, lat] depending on source
            // The backend sends { latitude, longitude } in `update_location` event in socket.js
            if (coords && coords.latitude && coords.longitude) {
                const newPos = [coords.latitude, coords.longitude];
                setDriverPos(newPos);
                if (driverMarkerRef.current) {
                    driverMarkerRef.current.setLatLng(newPos);
                }
                setLastSync(new Date().toLocaleTimeString());
            }
        };

        socket.on('driver_location_update', handleLocationUpdate);

        socket.on('order_status_update', (data) => {
            // Refresh full data on status change
            fetchTracking();
            notification.info({ message: `Order Status Updated: ${data.status}` });
        });

        return () => {
            socket.off('driver_location_update', handleLocationUpdate);
            socket.off('order_status_update');
        };
    }, [socket, id]);

    // Initialize Map Once
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(driverPos, 15);

            // Layers
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
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
                driverMarkerRef.current = null;
                pharmacyMarkerRef.current = null;
                destMarkerRef.current = null;
            }
        };
    }, []);

    // Update Markers and Bounds
    useEffect(() => {
        if (!mapInstance.current || !orderData) return;

        const markers = [];

        // 1. Driver/Courier Marker
        if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng(driverPos);
        } else {
            const courierIcon = L.divIcon({
                className: 'pulse-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            driverMarkerRef.current = L.marker(driverPos, { icon: courierIcon })
                .addTo(mapInstance.current)
                .bindPopup('<b>Courier</b><br/>Heading to your location');
        }
        markers.push(driverPos);

        // 2. Destination Marker
        if (orderData?.address?.coordinates || orderData?.address?.geojson?.coordinates) {
            const destPos = orderData.address.coordinates ?
                [orderData.address.coordinates.latitude, orderData.address.coordinates.longitude] :
                [orderData.address.geojson.coordinates[1], orderData.address.geojson.coordinates[0]];

            if (destMarkerRef.current) {
                destMarkerRef.current.setLatLng(destPos);
            } else {
                const destIcon = L.divIcon({
                    className: 'customer-destination-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                });
                destMarkerRef.current = L.marker(destPos, { icon: destIcon })
                    .addTo(mapInstance.current)
                    .bindPopup('<b>Delivery Destination</b><br/>You are here');
            }
            markers.push(destPos);
        }

        // 3. Pharmacy Marker
        if (orderData?.pharmacy?.location?.coordinates) {
            const [plng, plat] = orderData.pharmacy.location.coordinates;
            const pPos = [plat, plng];

            if (pharmacyMarkerRef.current) {
                pharmacyMarkerRef.current.setLatLng(pPos);
            } else {
                const pharmacyIcon = L.divIcon({
                    className: 'pharmacy-marker-icon',
                    html: '🏥',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                });
                pharmacyMarkerRef.current = L.marker(pPos, { icon: pharmacyIcon })
                    .addTo(mapInstance.current)
                    .bindPopup(`<b>${orderData.pharmacy.name}</b><br/>Pickup Point`);
            }
            markers.push(pPos);
        }

        // Fit bounds once when data is available
        if (markers.length > 1) {
            const bounds = L.latLngBounds(markers);
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [orderData, driverPos]);

    useEffect(() => {
        fetchTracking(); // Initial fetch
        const interval = setInterval(fetchTracking, 15000); // Poll every 15s

        return () => clearInterval(interval);
    }, [id]);

    const getStatusIcon = (status, isCurrent) => {
        if (status === 'in_transit') return <LoadingOutlined style={{ color: '#1E88E5', fontSize: '16px' }} />;
        if (isCurrent) return <ClockCircleOutlined style={{ color: '#1E88E5', fontSize: '16px' }} />;
        return <CheckCircleFilled style={{ color: '#43A047', fontSize: '16px' }} />;
    };

    const statusMapping = {
        'confirmed': 'Order Accepted',
        'preparing': 'Packed',
        'ready': 'Picked Up',
        'out_for_delivery': 'On the Way',
        'delivered': 'Delivered'
    };

    const timelineItems = (orderData?.statusHistory || []).map((item, index) => {
        const mappedStatus = statusMapping[item.status] || (item.status ? item.status.replace(/_/g, ' ') : 'Unknown');
        const isLatest = index === (orderData?.statusHistory.length - 1);

        return {
            dot: getStatusIcon(item.status, isLatest),
            children: (
                <div>
                    <Text strong style={{ textTransform: 'capitalize', color: isLatest ? '#1E88E5' : 'inherit' }}>
                        {mappedStatus}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(item.timestamp || new Date()).toLocaleString()}
                    </Text>
                    {item.note && <div style={{ fontSize: '13px', marginTop: '4px' }}>{item.note}</div>}
                </div>
            )
        };
    });

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><LoadingOutlined style={{ fontSize: '24px' }} /></div>;

    return (
        <div className="tracking-container fade-in">
            <div className="tracking-header" style={{ marginBottom: '24px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/customer/orders')}
                    style={{ marginBottom: '16px' }}
                >
                    Back to Orders
                </Button>
                <Title level={2}>Track Order #{id || '1024'}</Title>
            </div>

            <Row gutter={[24, 24]}>
                {/* Map Section */}
                <Col xs={24} lg={16}>
                    <Card className="map-card-wrapper" bordered={false}>
                        <div
                            ref={mapRef}
                            style={{ height: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}
                        />
                        <div className="map-overlay-info">
                            <Space size="middle">
                                <Badge status="processing" text="Live Tracking Enabled" />
                                <Text type="secondary" style={{ fontSize: '12px' }}>Last sync: {lastSync}</Text>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* Status Section */}
                <Col xs={24} lg={8}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>Order Status</Title>} style={{ marginBottom: '24px' }}>
                        <div style={{ padding: '12px 0' }}>
                            <Timeline items={timelineItems} />
                        </div>
                    </Card>

                    <Card className="driver-info-card">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Avatar size={54} icon={<UserOutlined />} style={{ background: '#E3F2FD', color: '#1E88E5' }} />
                            </Col>
                            <Col flex="auto">
                                <Text strong style={{ fontSize: '16px' }}>
                                    {orderData?.courier?.firstName} {orderData?.courier?.lastName || ''}
                                </Text>
                                <br /><Text type="secondary">MediLink Courier Partner • {orderData?.courier?.phone || 'Carrier'}</Text>
                            </Col>
                        </Row>
                        <Divider style={{ margin: '16px 0' }} />
                        <Row gutter={12}>
                            <Col span={12}>
                                <Button block icon={<PhoneOutlined />} type="default">Call</Button>
                            </Col>
                            <Col span={12}>
                                <Button block icon={<MessageOutlined />} type="primary">Message</Button>
                            </Col>
                        </Row>
                    </Card>

                    <Card style={{ marginTop: '24px' }}>
                        <Title level={5}>Need Help?</Title>
                        <Text type="secondary" style={{ fontSize: '13px' }}>If you have issues with your order, contact our 24/7 support.</Text>
                        <Button block type="dashed" style={{ marginTop: '16px' }}>Support Chat</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OrderTracking;
