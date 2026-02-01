import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Input, theme, Spin } from 'antd';
import {
    EnvironmentOutlined,
    SearchOutlined,
    ShopOutlined,
    MedicineBoxOutlined,
    AimOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../pages/customer/Pharmacies/Pharmacies.css';

const { Title, Text } = Typography;

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NearbyPharmaciesExplorer = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});

    // Fetch Pharmacies logic
    useEffect(() => {
        const fetchPharmacies = async () => {
            setLoading(true);
            try {
                const params = {};
                if (searchQuery) params.search = searchQuery;
                if (userLocation) {
                    params.lat = userLocation[0];
                    params.lng = userLocation[1];
                    params.radius = 5;
                }

                const response = await apiClient.get('/pharmacy', { params });
                const data = response.data;

                if (data.success) {
                    setPharmacies(data.data.map(p => ({
                        id: p._id,
                        name: p.name,
                        pos: p.location?.coordinates ? [p.location.coordinates[1], p.location.coordinates[0]] : [9.03, 38.74],
                        address: p.address?.city || 'Addis Ababa',
                        rating: p.rating || 4.5
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch pharmacies:', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchPharmacies, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, userLocation]);

    // Initialize Map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView([9.0227, 38.7460], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png', {
                maxZoom: 19,
            }).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (!mapInstance.current) return;

        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        pharmacies.forEach(ph => {
            const marker = L.marker(ph.pos)
                .addTo(mapInstance.current)
                .bindPopup(`<b>${ph.name}</b><br/>${ph.address}`);
            markersRef.current[ph.id] = marker;
        });
    }, [pharmacies]);

    const handleLocate = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(coords);
                    mapInstance.current.flyTo(coords, 14);
                    setLoadingLocation(false);
                },
                () => setLoadingLocation(false)
            );
        }
    };

    return (
        <Card bordered={false} className="explorer-card" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <Row gutter={0}>
                <Col xs={24} lg={8} style={{ padding: '32px', borderRight: '1px solid #f0f0f0' }}>
                    <Title level={3}>Find Nearby Providers</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                        Browse verified pharmacies near your current location.
                    </Text>

                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Pharmacy name..."
                            size="large"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Button
                            block
                            size="large"
                            icon={<AimOutlined />}
                            onClick={handleLocate}
                            loading={loadingLocation}
                        >
                            Use My Location
                        </Button>
                    </Space>

                    <Divider style={{ margin: '24px 0' }} />

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
                        ) : (
                            <List
                                dataSource={pharmacies.slice(0, 5)}
                                renderItem={item => (
                                    <List.Item
                                        style={{ cursor: 'pointer', padding: '12px 8px' }}
                                        onClick={() => mapInstance.current.flyTo(item.pos, 15)}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<ShopOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }} />}
                                            title={<Text strong>{item.name}</Text>}
                                            description={item.address}
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </div>

                    <Button
                        type="link"
                        block
                        style={{ marginTop: '16px' }}
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate('/pharmacies')}
                    >
                        View Full Map Explorer
                    </Button>
                </Col>
                <Col xs={24} lg={16}>
                    <div ref={mapRef} style={{ height: '500px', width: '100%', zIndex: 1 }} />
                </Col>
            </Row>
        </Card>
    );
};

const Divider = ({ style }) => <div style={{ height: '1px', background: '#f0f0f0', ...style }} />;

export default NearbyPharmaciesExplorer;
