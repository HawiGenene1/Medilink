import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Space, message, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, PushpinOutlined, AimOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ordersAPI } from '../../../services/api/orders';
import './OrderTracking.css'; // Reuse tracking styles for map layout

const { Title, Text, Paragraph } = Typography;

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SetOrderLocation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [order, setOrder] = useState(null);
    const [selectedPos, setSelectedPos] = useState([9.0227, 38.7460]); // Default to Addis Ababa

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    const fetchOrder = async () => {
        try {
            const res = await ordersAPI.getOrderDetails(orderId);
            if (res.data.success) {
                setOrder(res.data.data);
                if (res.data.data.address?.coordinates) {
                    setSelectedPos([
                        res.data.data.address.coordinates.latitude,
                        res.data.data.address.coordinates.longitude
                    ]);
                }
            }
        } catch (err) {
            message.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // Initialize Map
    useEffect(() => {
        if (!loading && mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView(selectedPos, 15);

            // High-Resolution Satellite Hybrid Layer (ESRI) - Matches Pharmacy Finder
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'ESRI World Imagery'
            }).addTo(mapInstance.current);

            // Add Road Overlay for Hybrid View
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                opacity: 0.8
            }).addTo(mapInstance.current);

            // Add click listener to map
            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                updateMarker([lat, lng]);
            });

            // Add initial marker
            const pickIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #1e88e5; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });

            markerRef.current = L.marker(selectedPos, { icon: pickIcon, draggable: true })
                .addTo(mapInstance.current);

            markerRef.current.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                setSelectedPos([pos.lat, pos.lng]);
            });

            // Fix map size issues aggressively
            const fixSize = () => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            };
            
            setTimeout(fixSize, 100);
            setTimeout(fixSize, 500);
            setTimeout(fixSize, 2000);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [loading]);

    const updateMarker = (pos) => {
        setSelectedPos(pos);
        if (markerRef.current) {
            markerRef.current.setLatLng(pos);
            if (mapInstance.current) {
                mapInstance.current.panTo(pos);
            }
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            message.error('Geolocation is not supported by your browser');
            return;
        }

        message.loading({ content: 'Fetching location...', key: 'geo' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                updateMarker([latitude, longitude]);
                message.success({ content: 'Location updated!', key: 'geo' });
            },
            (error) => {
                message.error({ content: 'Failed to get location: ' + error.message, key: 'geo' });
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await ordersAPI.updateOrderAddress(orderId, {
                coordinates: {
                    latitude: selectedPos[0],
                    longitude: selectedPos[1]
                },
                label: 'Selected Delivery Location'
            });
            message.success('Delivery location updated successfully!');
            setTimeout(() => navigate(`/customer/orders/track/${orderId}`), 1500);
        } catch (err) {
            message.error('Failed to update location');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" tip="Loading Map..." />
        </div>
    );

    return (
        <div className="tracking-container fade-in" style={{ padding: '24px' }}>
            <div className="tracking-header" style={{ marginBottom: '24px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px' }}
                >
                    Back
                </Button>
                <Title level={2}>Confirm Delivery Location</Title>
                <Paragraph type="secondary">
                    Please drag the marker or click on the map to set your exact delivery location for Order #{order?.orderNumber}.
                </Paragraph>
            </div>

            <Card style={{ borderRadius: '16px', overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
                <div
                    ref={mapRef}
                    style={{ height: '500px', width: '100%', background: '#fff' }}
                />
                <div style={{ padding: '24px', background: '#fff' }}>
                    <Alert
                        message="Location Selection"
                        description="Once you've selected your location, click 'Confirm & Proceeed' to start the delivery process."
                        type="info"
                        showIcon
                        icon={<PushpinOutlined />}
                        style={{ marginBottom: '24px', borderRadius: '12px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button 
                            icon={<AimOutlined />} 
                            onClick={handleUseCurrentLocation}
                            style={{ marginRight: 'auto' }}
                        >
                            Use Current Location
                        </Button>
                        <Button size="large" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            onClick={handleSave}
                            loading={saving}
                            style={{ height: 'auto', padding: '10px 40px', fontSize: '16px', borderRadius: '8px' }}
                        >
                            Confirm & Proceed
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SetOrderLocation;
