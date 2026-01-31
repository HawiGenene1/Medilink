import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Input, Rate, theme } from 'antd';
import {
    EnvironmentOutlined,
    SearchOutlined,
    ShopOutlined,
    PhoneOutlined,
    CompassOutlined,
    FilterOutlined,
    MedicineBoxOutlined,
    AimOutlined
} from '@ant-design/icons';
import { AutoComplete, Slider } from 'antd';
import medicinesAPI from '../../../services/api/medicines';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Pharmacies.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Title, Text } = Typography;


// SVG Icon Component
const NavigationOutlined = (props) => (
    <span role="img" aria-label="navigation" className="anticon anticon-navigation" {...props}>
        <svg viewBox="64 64 896 896" focusable="false" data-icon="navigation" width="1em" height="1em" fill="currentColor">
            <path d="M759.2 124.8L124.8 424c-11.2 5.1-12.8 20.8-2.6 28.2l313.3 227.3a12 12 0 014.2 13.9l127.3 351c4.5 12.4 22.3 12.5 27 0L920 152.1c4.4-11.3-8.8-22.3-20.8-17.3zM512 512L256 384l512-128-128 512-128-256z"></path>
        </svg>
    </span>
);

const Pharmacies = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [radius, setRadius] = useState(5); // 5km radius
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const { token } = theme.useToken();

    const mapRef = React.useRef(null);
    const mapInstance = React.useRef(null);
    const markersRef = React.useRef({});
    const userMarkerRef = React.useRef(null);

    // Fetch Pharmacies
    useEffect(() => {
        const fetchPharmacies = async () => {
            setLoading(true);
            try {
                // Construct query params
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                if (medicineSearch) params.append('medicine', medicineSearch);
                if (userLocation) {
                    params.append('lat', userLocation[0]);
                    params.append('lng', userLocation[1]);
                    params.append('radius', radius);
                }

                // Call our endpoint
                const response = await fetch(`http://localhost:5000/api/pharmacy?${params.toString()}`);
                const data = await response.json();

                if (data.success) {
                    // Transform data for display
                    const mapped = data.data.map(p => ({
                        id: p._id,
                        name: p.name,
                        pos: p.location?.coordinates ? [p.location.coordinates[1], p.location.coordinates[0]] : [9.03, 38.74],
                        rating: p.rating || 0,
                        address: p.address?.street ? `${p.address.city}, ${p.address.street}` : p.address?.city || 'Addis Ababa',
                        status: p.status === 'approved' ? 'Open' : 'Closed',
                        distance: userLocation ? 'Calculating...' : 'N/A',
                        phone: p.phone
                    }));
                    setPharmacies(mapped);
                }
            } catch (error) {
                console.error('Failed to fetch pharmacies:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchPharmacies, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, medicineSearch, userLocation, radius]);

    // Haversine formula for distance
    const getDistance = (pos1, pos2) => {
        const R = 6371; // km
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    };

    // Load medicine options for AutoComplete
    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const response = await medicinesAPI.list();
                if (response.data) {
                    setMedicineOptions(response.data.map(m => ({ value: m.name })));
                }
            } catch (err) {
                console.error('Failed to fetch medicines:', err);
            }
        };
        fetchMedicines();
    }, []);

    // Filter and Calculate Distances
    const filteredPharmacies = pharmacies.map(ph => {
        let dist = 'N/A';
        let distVal = 99999;
        if (userLocation) {
            distVal = getDistance(userLocation, ph.pos);
            dist = `${distVal} km`;
        }
        return { ...ph, distance: dist, distVal };
    }).sort((a, b) => a.distVal - b.distVal); // Sort by distance

    const handleLocateUser = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const pos = [latitude, longitude];
                    setUserLocation(pos);
                    setLoadingLocation(false);
                    if (mapInstance.current) {
                        mapInstance.current.setView(pos, 15);

                        // Update or Create User Marker
                        if (userMarkerRef.current) {
                            userMarkerRef.current.setLatLng(pos);
                        } else {
                            const userIcon = L.divIcon({
                                className: 'user-location-marker',
                                html: '<div class="pulse"></div>',
                                iconSize: [20, 20]
                            });
                            userMarkerRef.current = L.marker(pos, { icon: userIcon })
                                .addTo(mapInstance.current)
                                .bindPopup("You are here");
                        }
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLoadingLocation(false);
                }
            );
        }
    };

    // Initialize Map with ESRI Layers
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([9.0227, 38.7460], 13);

            // ESRI Satellite Tiles
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'ESRI World Imagery'
            }).addTo(mapInstance.current);

            // Road Overlay
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                opacity: 0.8
            }).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update Markers Effect
    useEffect(() => {
        if (!mapInstance.current) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        // Add new markers
        filteredPharmacies.forEach(ph => {
            const marker = L.marker(ph.pos)
                .addTo(mapInstance.current)
                .bindPopup(`
                    <div class="map-popup-content" style="color: ${token.colorText}; background: ${token.colorBgContainer}">
                        <strong style="color: ${token.colorPrimary}">${ph.name}</strong><br />
                        <span style="font-size: 12px; color: ${token.colorTextSecondary}">${ph.address}</span><br />
                        <div style="margin-top: 8px">
                            <span style="background: ${token.colorPrimary}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px">View Details</span>
                        </div>
                    </div>
                `);

            marker.on('click', () => setSelectedPharmacy(ph));
            markersRef.current[ph.id] = marker;
        });
    }, [pharmacies, token]);

    // Update map view when selectedPharmacy changes
    useEffect(() => {
        if (selectedPharmacy && mapInstance.current) {
            mapInstance.current.flyTo(selectedPharmacy.pos, 16);
            const marker = markersRef.current[selectedPharmacy.id];
            if (marker) marker.openPopup();
        }
    }, [selectedPharmacy]);

    return (
        <div className="pharmacies-page fade-in">
            <div className="pharmacies-layout">
                {/* Sidebar */}
                <div
                    className="pharmacy-sidebar"
                    style={{
                        background: token.colorBgContainer,
                        borderRight: `1px solid ${token.colorBorderSecondary}`
                    }}
                >
                    <div
                        className="sidebar-header"
                        style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
                    >
                        <Title level={3} style={{ margin: 0 }}>Nearby Pharmacies</Title>
                        <Text type="secondary">Found {filteredPharmacies.length} providers near you</Text>

                        <div className="search-box-wrapper" style={{ marginTop: '16px' }}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Search by name..."
                                className="pharmacy-search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ marginBottom: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <AutoComplete
                                    style={{ flex: 1 }}
                                    options={medicineOptions}
                                    value={medicineSearch}
                                    onChange={setMedicineSearch}
                                    filterOption={(inputValue, option) =>
                                        option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
                                >
                                    <Input
                                        prefix={<MedicineBoxOutlined />}
                                        placeholder="Search medicine stock..."
                                        allowClear
                                    />
                                </AutoComplete>
                                <Button
                                    icon={<AimOutlined />}
                                    loading={loadingLocation}
                                    onClick={handleLocateUser}
                                    title="Use GPS"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Radius: {radius}km</Text>
                            </div>
                            <Slider
                                min={1}
                                max={20}
                                value={radius}
                                onChange={setRadius}
                                tooltip={{ formatter: val => `${val}km` }}
                            />
                        </div>
                    </div>

                    <div className="pharmacy-list-scroll">
                        <List
                            loading={loading}
                            dataSource={filteredPharmacies}
                            renderItem={item => (
                                <div
                                    className={`pharmacy-list-card ${selectedPharmacy?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedPharmacy(item)}
                                    style={{
                                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                        background: selectedPharmacy?.id === item.id ? token.colorFillAlter : 'transparent'
                                    }}
                                >
                                    <Row gutter={16} align="middle">
                                        <Col flex="48px">
                                            <Avatar
                                                shape="square"
                                                size={48}
                                                icon={<ShopOutlined />}
                                                style={{
                                                    background: token.colorFillSecondary,
                                                    color: token.colorPrimary
                                                }}
                                            />
                                        </Col>
                                        <Col flex="auto">
                                            <Text strong className="ph-name">{item.name}</Text>
                                            <div className="ph-meta">
                                                <Space split={<span>•</span>}>
                                                    <span>⭐ {item.rating}</span>
                                                    <span>{item.distance}</span>
                                                </Space>
                                            </div>
                                            <Tag color={item.status === 'Open' ? 'success' : 'default'}>
                                                {item.status}
                                            </Tag>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Map Area */}
                <div className="pharmacy-map-area" style={{ background: token.colorFillAlter }}>
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                    {/* Floating Info Card */}
                    {selectedPharmacy && (
                        <Card
                            className="selected-pharmacy-floating-card slide-up"
                            style={{
                                background: token.colorBgContainer,
                                border: `1px solid ${token.colorBorderSecondary}`
                            }}
                        >
                            <Row justify="space-between" align="top">
                                <Col flex="auto">
                                    <Title level={4} style={{ margin: 0 }}>{selectedPharmacy.name}</Title>
                                    <Text type="secondary">{selectedPharmacy.address}</Text>
                                    <div style={{ marginTop: '12px' }}>
                                        <Space size="large">
                                            <Space><PhoneOutlined /> <Text>{selectedPharmacy.phone}</Text></Space>
                                            <Space><CompassOutlined /> <Text>{selectedPharmacy.distance}</Text></Space>
                                        </Space>
                                    </div>
                                </Col>
                                <Col>
                                    <Space>
                                        <Button type="primary" size="large" icon={<NavigationOutlined />}>Get Directions</Button>
                                        <Button type="text" onClick={() => setSelectedPharmacy(null)}>X</Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Pharmacies;
