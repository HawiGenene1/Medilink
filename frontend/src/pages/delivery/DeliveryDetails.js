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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryDetails.css';

const { Title, Text } = Typography;

const DeliveryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Delivery States: assigned -> picked_up -> in_transit -> arrived -> delivered
    const [status, setStatus] = useState('assigned');
    const [isNear, setIsNear] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);

    // Map States
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const courierMarkerRef = useRef(null);
    const [courierPos, setCourierPos] = useState([9.0227, 38.7460]);
    const destPos = [9.0300, 38.7500]; // Mock destination

    // Initialize Map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(courierPos, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
            mapRef.current.classList.add('soft-blue-map');

            // Destination Marker
            L.marker(destPos, {
                icon: L.divIcon({
                    className: 'destination-marker',
                    html: '<div style="background: #1E88E5; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(mapInstance.current).bindPopup('Customer Location');

            // Courier Marker
            courierMarkerRef.current = L.marker(courierPos, {
                icon: L.divIcon({
                    className: 'courier-pin',
                    html: '<div style="font-size: 24px;">🚗</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Simulate Movement & Proximity
    useEffect(() => {
        if (status === 'in_transit') {
            const interval = setInterval(() => {
                setCourierPos(prev => {
                    const newLat = prev[0] + 0.0002;
                    const newLng = prev[1] + 0.0001;
                    const newPos = [newLat, newLng];

                    if (courierMarkerRef.current) {
                        courierMarkerRef.current.setLatLng(newPos);
                    }

                    // Mock Distance check
                    const dist = Math.sqrt(Math.pow(newLat - destPos[0], 2) + Math.pow(newLng - destPos[1], 2));
                    if (dist < 0.005) setIsNear(true);

                    return newPos;
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const handleStatusTransition = () => {
        if (status === 'assigned') setStatus('picked_up');
        else if (status === 'picked_up') setStatus('in_transit');
        else if (status === 'in_transit') setShowProofModal(true);
    };

    const handleProofSubmit = () => {
        message.success('Delivery Completed Successfully');
        setStatus('delivered');
        setShowProofModal(false);
        setTimeout(() => navigate('/delivery/dashboard'), 2000);
    };

    const getButtonText = () => {
        if (status === 'assigned') return 'Confirm Medicine Pickup';
        if (status === 'picked_up') return 'Start Delivery Navigation';
        if (status === 'in_transit') return 'Complete Delivery';
        return 'Delivery Processed';
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
                            <Text strong block>Abebe Bikila</Text>
                            <Text type="secondary" style={{ fontSize: '13px' }}>Bole, Edna Mall area • 0.8 km away</Text>
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
                                <Text type="secondary">Bole, House 456, near Friendship Mall, Addis Ababa</Text>
                            </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <CheckCircleFilled style={{ color: '#43A047', marginTop: '4px' }} />
                            <div>
                                <Text strong block>Pharmacy Pickup</Text>
                                <Text type="secondary">Kenema Pharmacy - Bole Branch</Text>
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
                        onClick={handleStatusTransition}
                        disabled={status === 'delivered'}
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
