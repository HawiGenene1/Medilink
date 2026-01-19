import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, List, Avatar, Button, Tag, Space, Input, Rate } from 'antd';
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
    const [medicineSearch, setMedicineSearch] = useState('');
    const [radius, setRadius] = useState(5); // 5km radius
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const mapRef = React.useRef(null);
    const mapInstance = React.useRef(null);
    const markersRef = React.useRef({});
    const userMarkerRef = React.useRef(null);

    // Mock stock data (Internal mapping for demonstration)
    const stockData = {
        'ph-1': ['Amoxicillin', 'Paracetamol', 'Ibuprofen'],
        'ph-2': ['Amoxicillin', 'Aspirin'],
        'ph-3': ['Paracetamol', 'Vitamin C']
    };

    // Haversine formula for distance
    const getDistance = (pos1, pos2) => {
        const R = 6371; // km
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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
                // Fallback mock
                setMedicineOptions([
                    { value: 'Amoxicillin' },
                    { value: 'Paracetamol' },
                    { value: 'Ibuprofen' },
                    { value: 'Aspirin' }
                ]);
            }
        };
        fetchMedicines();
    }, []);

    const pharmacies = [
        {
            id: 'ph-1',
            name: 'Kenema Pharmacy No. 4',
            pos: [9.0227, 38.7460],
            rating: 4.8,
            reviews: 124,
            status: 'Open',
            distance: '0.5 km',
            address: 'Bole Road, Addis Ababa',
            phone: '+251 11 123 4567'
        },
        {
            id: 'ph-2',
            name: 'Abyssinia Central Pharma',
            pos: [9.0270, 38.7510],
            rating: 4.5,
            reviews: 89,
            status: 'Open',
            distance: '1.2 km',
            address: 'Kazanchis, Addis Ababa',
            phone: '+251 11 987 6543'
        },
        {
            id: 'ph-3',
            name: 'Red Cross Dispensary',
            pos: [9.0180, 38.7400],
            rating: 4.9,
            reviews: 312,
            status: 'Closed',
            distance: '2.5 km',
            address: 'Piazza, Addis Ababa',
            phone: '+251 11 555 0199'
        }
    ];

    // Filter Pharmacies
    const filteredPharmacies = pharmacies.filter(ph => {
        const matchesName = ph.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMedicine = medicineSearch ? stockData[ph.id]?.some(m => m.toLowerCase().includes(medicineSearch.toLowerCase())) : true;

        // Distance filter if user location is known
        if (userLocation) {
            const dist = getDistance(userLocation, ph.pos);
            return matchesName && matchesMedicine && dist <= radius;
        }

        return matchesName && matchesMedicine;
    });

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
                        mapInstance.current.flyTo(pos, 15);

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

    // Initialize Map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([9.0227, 38.7460], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            // Add Markers
            pharmacies.forEach(ph => {
                const marker = L.marker(ph.pos)
                    .addTo(mapInstance.current)
                    .bindPopup(`
                        <div class="map-popup-content">
                            <strong style="color: #1E88E5">${ph.name}</strong><br />
                            <span style="font-size: 12px; color: #666">${ph.address}</span><br />
                            <div style="margin-top: 8px">
                                <span style="background: #1E88E5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px">View Details</span>
                            </div>
                        </div>
                    `);

                marker.on('click', () => setSelectedPharmacy(ph));
                markersRef.current[ph.id] = marker;
            });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update map view when selectedPharmacy changes
    useEffect(() => {
        if (selectedPharmacy && mapInstance.current) {
            mapInstance.current.flyTo(selectedPharmacy.pos, 15);
            const marker = markersRef.current[selectedPharmacy.id];
            if (marker) marker.openPopup();
        }
    }, [selectedPharmacy]);

    return (
        <div className="pharmacies-page fade-in">
            <div className="pharmacies-layout">
                {/* Sidebar */}
                <div className="pharmacy-sidebar">
                    <div className="sidebar-header">
                        <Title level={3} style={{ margin: 0 }}>Nearby Pharmacies</Title>
                        <Text type="secondary">Found {filteredPharmacies.length} providers near you</Text>

                        <div className="search-box-wrapper">
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Search by pharmacy..."
                                className="pharmacy-search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <Button
                                icon={<AimOutlined />}
                                loading={loadingLocation}
                                onClick={handleLocateUser}
                                title="Locate Me"
                            />
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <Text type="secondary" size="small">Find Medicines</Text>
                            <AutoComplete
                                style={{ width: '100%', marginTop: '4px' }}
                                options={medicineOptions}
                                placeholder="Search medicine stock..."
                                value={medicineSearch}
                                onChange={setMedicineSearch}
                                filterOption={(inputValue, option) =>
                                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                }
                            >
                                <Input prefix={<MedicineBoxOutlined />} allowClear />
                            </AutoComplete>
                        </div>

                        {userLocation && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Radius: {radius}km</Text>
                                    <Text type="secondary" style={{ fontSize: '10px' }}>Proximal Filtering</Text>
                                </div>
                                <Slider
                                    min={1}
                                    max={20}
                                    value={radius}
                                    onChange={setRadius}
                                    tooltip={{ formatter: val => `${val}km` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="pharmacy-list-scroll">
                        <List
                            dataSource={filteredPharmacies}
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
                                                style={{ background: '#E3F2FD', color: '#1E88E5' }}
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
                                    <div style={{ marginTop: '12px' }}>
                                        <Space size="large">
                                            <Space><PhoneOutlined /> <Text>{selectedPharmacy.phone}</Text></Space>
                                            <Space><CompassOutlined /> <Text>{selectedPharmacy.distance} away</Text></Space>
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
