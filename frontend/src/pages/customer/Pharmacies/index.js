import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Input, Rate, theme, Breadcrumb, Divider } from 'antd';
import {
    EnvironmentOutlined,
    SearchOutlined,
    ShopOutlined,
    PhoneOutlined,
    CompassOutlined,
    MedicineBoxOutlined,
    AimOutlined,
    RightOutlined,
    UndoOutlined
} from '@ant-design/icons';
import { AutoComplete, Slider } from 'antd';
import medicinesAPI from '../../../services/api/medicines';
import apiClient from '../../../services/api/config';
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
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [radius, setRadius] = useState(5);
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);

    // Fetch Pharmacies
    useEffect(() => {
        const fetchPharmacies = async () => {
            setLoading(true);
            try {
                const params = {};
                if (searchQuery) params.search = searchQuery;
                if (medicineSearch) params.medicine = medicineSearch;
                if (userLocation) {
                    params.lat = userLocation[0];
                    params.lng = userLocation[1];
                    params.radius = radius;
                }

                const response = await apiClient.get('/pharmacy', { params });
                const data = response.data;

                if (data.success) {
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

        const timeoutId = setTimeout(fetchPharmacies, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, medicineSearch, userLocation, radius]);

    // Haversine distance
    const getDistance = (pos1, pos2) => {
        const R = 6371;
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    };

    // Load medicine options
    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const response = await medicinesAPI.list();
                if (response.data?.data) {
                    setMedicineOptions(response.data.data.map(m => ({ value: m.name })));
                }
            } catch (err) {
                console.error('Failed to fetch medicines:', err);
            }
        };
        fetchMedicines();
    }, []);

    const filteredPharmacies = pharmacies.map(ph => {
        let dist = 'N/A';
        let distVal = 99999;
        if (userLocation) {
            distVal = getDistance(userLocation, ph.pos);
            dist = `${distVal} km`;
        }
        return { ...ph, distance: dist, distVal };
    }).sort((a, b) => a.distVal - b.distVal);

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

    // Initialize Map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView([9.0227, 38.7460], 13);

            L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>'
            }).addTo(mapInstance.current);

            // Force recalculate size after a short delay
            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            }, 500);
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
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        filteredPharmacies.forEach(ph => {
            const marker = L.marker(ph.pos)
                .addTo(mapInstance.current)
                .bindPopup(`
                    <div class="map-popup-content">
                        <strong>${ph.name}</strong><br />
                        <span style="font-size: 12px; color: #666">${ph.address}</span>
                    </div>
                `);
            marker.on('click', () => setSelectedPharmacy(ph));
            markersRef.current[ph.id] = marker;
        });
    }, [pharmacies, token]);

    useEffect(() => {
        if (selectedPharmacy && mapInstance.current) {
            mapInstance.current.flyTo(selectedPharmacy.pos, 16);
            const marker = markersRef.current[selectedPharmacy.id];
            if (marker) marker.openPopup();
        }
    }, [selectedPharmacy]);

    const resetFilters = () => {
        setSearchQuery('');
        setMedicineSearch('');
        setRadius(5);
        setUserLocation(null);
    };

    return (
        <div className="pharmacies-page fade-in">
            <div className="pharmacies-layout">
                {/* Sidebar */}
                <div className="pharmacy-sidebar">
                    <div className="sidebar-header">
                        <Space align="center" style={{ marginBottom: '24px' }}>
                            <div style={{ padding: '8px', background: token.colorPrimary, borderRadius: '12px', color: 'white', display: 'flex' }}>
                                <EnvironmentOutlined style={{ fontSize: '20px' }} />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: 0, fontSize: '22px' }}>Pharmacy Finder</Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Explore verified providers near you</Text>
                            </div>
                        </Space>

                        <div className="search-box-wrapper">
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Search by name..."
                                    size="large"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
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
                                            placeholder="Stock search..."
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
                            </Space>
                        </div>

                        <div style={{ marginTop: '24px', padding: '16px', background: token.colorFillAlter, borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text strong style={{ fontSize: '13px' }}>Search Radius</Text>
                                <Tag color="blue">{radius} km</Tag>
                            </div>
                            <Slider
                                min={1}
                                max={20}
                                value={radius}
                                onChange={setRadius}
                            />
                            <Text type="secondary" style={{ fontSize: '11px' }}>Finding pharmacies within {radius}km of your location.</Text>
                        </div>
                    </div>

                    <div className="pharmacy-list-scroll">
                        <List
                            loading={loading}
                            dataSource={filteredPharmacies}
                            locale={{
                                emptyText: (
                                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                        <div style={{ marginBottom: '16px', fontSize: '48px', opacity: 0.2, color: token.colorPrimary }}>
                                            <ShopOutlined />
                                        </div>
                                        <Text strong style={{ display: 'block', fontSize: '16px' }}>No Pharmacies Found</Text>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                            Try adjusting filters or expanding your radius.
                                        </Text>

                                        <div style={{ marginTop: '24px', textAlign: 'left', background: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #eee' }}>
                                            <Text strong style={{ fontSize: '13px' }}>Quick Tips:</Text>
                                            <ul style={{ paddingLeft: '20px', marginTop: '12px', fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
                                                <li>Check spelling or try generic names</li>
                                                <li>Increase radius up to 20km</li>
                                                <li>Enable GPS for accurate local results</li>
                                            </ul>
                                            <Button
                                                block
                                                icon={<UndoOutlined />}
                                                style={{ marginTop: '12px' }}
                                                onClick={resetFilters}
                                            >
                                                Reset Settings
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }}
                            renderItem={item => (
                                <div
                                    className={`pharmacy-list-card ${selectedPharmacy?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedPharmacy(item)}
                                >
                                    <Row gutter={16} align="middle">
                                        <Col flex="48px">
                                            <Avatar
                                                shape="square"
                                                size={48}
                                                icon={<ShopOutlined />}
                                                style={{ background: token.colorFillSecondary, color: token.colorPrimary }}
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
                <div className="pharmacy-map-area">
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                    {/* Floating Info Card */}
                    {selectedPharmacy && (
                        <Card className="selected-pharmacy-floating-card slide-up">
                            <Row justify="space-between" align="top">
                                <Col flex="auto">
                                    <Title level={4} style={{ margin: 0 }}>{selectedPharmacy.name}</Title>
                                    <Text type="secondary">{selectedPharmacy.address}</Text>
                                    <div style={{ marginTop: '16px' }}>
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
