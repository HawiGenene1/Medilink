import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Timeline, Tag, Avatar, Space, Divider, Badge, Modal } from 'antd';
import {
    ArrowLeftOutlined,
    PhoneOutlined,
    MessageOutlined,
    ClockCircleOutlined,
    CheckCircleFilled,
    NavigationOutlined,
    UserOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ordersAPI } from '../../../services/api/orders';
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

    // Live Tracking State
    const [driverPos, setDriverPos] = useState([9.0227, 38.7460]); // Fallback pos

    const fetchTracking = async () => {
        try {
            const response = await ordersAPI.getTracking(id);
            if (response.data?.success) {
                const tracking = response.data.data;
                setOrderData(tracking);
                if (tracking.deliveryPerson?.location) {
                    const newPos = [
                        tracking.deliveryPerson.location.latitude,
                        tracking.deliveryPerson.location.longitude
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

    // Initialize Map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView(driverPos, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            driverMarkerRef.current = L.marker(driverPos)
                .addTo(mapInstance.current)
                .bindPopup('Driver is here. Heading to your location.');
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        fetchTracking(); // Initial fetch
        const interval = setInterval(fetchTracking, 15000); // Poll every 15s

        return () => clearInterval(interval);
    }, [id]);

    const getStatusIcon = (status, isCurrent) => {
        if (status === 'out_for_delivery') return <LoadingOutlined style={{ color: '#1E88E5', fontSize: '16px' }} />;
        if (isCurrent) return <ClockCircleOutlined style={{ color: '#1E88E5', fontSize: '16px' }} />;
        return <CheckCircleFilled style={{ color: '#43A047', fontSize: '16px' }} />;
    };

    const timelineItems = (orderData?.statusHistory || []).map((item, index) => ({
        dot: getStatusIcon(item.status, index === (orderData?.statusHistory.length - 1)),
        children: (
            <div>
                <Text strong style={{ textTransform: 'capitalize' }}>
                    {item.status.replace(/_/g, ' ')}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(item.timestamp || new Date()).toLocaleString()}
                </Text>
                {item.note && <div style={{ fontSize: '13px' }}>{item.note}</div>}
            </div>
        )
    }));

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
                                <Text strong style={{ fontSize: '16px' }}>Samuel Girma</Text>
                                <br /><Text type="secondary">MediLink Delivery Partner</Text>
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
                        <Text type="secondary" style={{ fontSize: '13px' }}>If you have issues with your clinical delivery, contact our 24/7 support.</Text>
                        <Button block type="dashed" style={{ marginTop: '16px' }}>Support Chat</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OrderTracking;
