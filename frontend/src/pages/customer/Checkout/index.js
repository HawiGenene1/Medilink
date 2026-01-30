import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Steps, Space, Radio, Divider, Avatar, Result, Tag, Alert, Input, notification } from 'antd';
import {
    EnvironmentOutlined,
    SafetyCertificateOutlined,
    CreditCardOutlined,
    CarryOutOutlined,
    CheckCircleFilled,
    MedicineBoxOutlined,
    ArrowLeftOutlined,
    CompassOutlined,
    MessageOutlined,
    ShoppingCartOutlined,
    LoadingOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { ordersAPI } from '../../../services/api/orders';
import api from '../../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Checkout.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Title, Text, Paragraph } = Typography;

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, subtotal, clearCart } = useCart();
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('telebirr');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Location State
    const [mapCenter, setMapCenter] = useState([9.0227, 38.7460]); // Addis Ababa default
    const [locationLabel, setLocationLabel] = useState('Locating...');
    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [selectedAddressCoords, setSelectedAddressCoords] = useState(null);

    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const geocodeTimeout = useRef(null);
    const accuracyCircleRef = useRef(null);
    const isProgrammaticMove = useRef(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const steps = [
        { title: 'Location', icon: <EnvironmentOutlined /> },
        { title: 'Prescription', icon: <SafetyCertificateOutlined /> },
        { title: 'Payment', icon: <CreditCardOutlined /> },
        { title: 'Review', icon: <CarryOutOutlined /> },
    ];

    // Reverse Geocoding
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            if (data && data.address) {
                const a = data.address;
                // Prioritize specific local descriptors
                const specific = a.amenity || a.building || a.shop || a.office || a.tourism || a.leisure;
                const road = a.road || a.street || a.pedestrian;
                const local = a.neighbourhood || a.suburb || a.subdistrict;
                const area = a.district || a.city || a.town;

                const parts = [specific, a.house_number, road, local, area].filter(Boolean);

                // If the structured parts are too short, use the display_name which often has landmarks
                let address = parts.length >= 2 ? parts.join(', ') : data.display_name;

                // Clean up any double-comma or trailing comma issues
                address = address.split(', ').filter((item, index, self) => self.indexOf(item) === index).join(', ');

                setLocationLabel(address);
            } else if (data && data.display_name) {
                setLocationLabel(data.display_name);
            } else {
                setLocationLabel(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
        } catch (error) {
            console.error('Geocoding failed:', error);
            setLocationLabel(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    // Initialize Map for Step 0
    useEffect(() => {
        if (currentStep === 0 && mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(mapCenter, 17); // Closer initial zoom

            // High-Resolution Satellite Hybrid Layer (ESRI)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'ESRI World Imagery'
            }).addTo(mapInstance.current);

            // Add Road Overlay for Hybrid View
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                opacity: 0.8
            }).addTo(mapInstance.current);

            // Initial geocode
            if (mapCenter[0] === 9.0227 && mapCenter[1] === 38.7460) {
                handleUseCurrentLocation(true);
            } else {
                reverseGeocode(mapCenter[0], mapCenter[1]);
            }

            // Handle Map Movement
            mapInstance.current.on('move', () => {
                if (isProgrammaticMove.current) {
                    isProgrammaticMove.current = false;
                    return;
                }

                const center = mapInstance.current.getCenter();
                setMapCenter([center.lat, center.lng]);
                setIsLocationConfirmed(false); // Reset confirmation on manual move

                // Debounced Geocoding
                if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
                geocodeTimeout.current = setTimeout(() => {
                    reverseGeocode(center.lat, center.lng);
                }, 800);
            });

            // Try to get current location on mount to avoid "mock" feel
            if (mapCenter[0] === 9.0227 && mapCenter[1] === 38.7460) {
                handleUseCurrentLocation(true); // silent initialization
            } else {
                // Initial geocode
                reverseGeocode(mapCenter[0], mapCenter[1]);
            }
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [currentStep]);

    // Load Pharmacy Location
    useEffect(() => {
        if (cartItems.length > 0 && cartItems[0].pharmacyId) {
            const fetchPharmacy = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/pharmacy/${cartItems[0].pharmacyId}`);
                    const data = await response.json();
                    if (data.success && data.data.location?.coordinates) {
                        const [lng, lat] = data.data.location.coordinates;

                        // Add pharmacy marker to map if map exists
                        if (mapInstance.current) {
                            const pharmacyIcon = L.divIcon({
                                className: 'pharmacy-marker-icon',
                                html: '🏥',
                                iconSize: [30, 30],
                                iconAnchor: [15, 30]
                            });
                            L.marker([lat, lng], { icon: pharmacyIcon })
                                .addTo(mapInstance.current)
                                .bindPopup(`<b>${data.data.name}</b><br/>Pickup Location`)
                                .openPopup();
                        }
                    }
                } catch (error) {
                    console.error('Failed to load pharmacy location', error);
                }
            };
            fetchPharmacy();
        }
    }, [cartItems, currentStep]);

    const handleNext = () => {
        if (currentStep === 0 && !isLocationConfirmed) {
            return; // Safety rule
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleConfirmLocation = () => {
        setSelectedAddressCoords(mapCenter);
        setIsLocationConfirmed(true);
    };

    const handleUseCurrentLocation = (isInitial = false) => {
        if ("geolocation" in navigator) {
            if (!isInitial) setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setMapCenter([latitude, longitude]);
                    setSelectedAddressCoords([latitude, longitude]); // Immediately "save" the real coordinates
                    setIsLocationConfirmed(true); // Auto-confirm GPS location

                    if (mapInstance.current) {
                        isProgrammaticMove.current = true;
                        mapInstance.current.flyTo([latitude, longitude], 18);

                        // Add Accuracy Circle
                        if (accuracyCircleRef.current) {
                            mapInstance.current.removeLayer(accuracyCircleRef.current);
                        }

                        accuracyCircleRef.current = L.circle([latitude, longitude], {
                            radius: accuracy,
                            color: accuracy > 100 ? '#FFA000' : '#1E88E5',
                            fillColor: accuracy > 100 ? '#FFA000' : '#1E88E5',
                            fillOpacity: 0.1,
                            weight: 1
                        }).addTo(mapInstance.current);
                    }

                    // Immediately trigger geocode for current location
                    reverseGeocode(latitude, longitude);
                    setIsLocationConfirmed(true); // Auto-confirm GPS location

                    if (!isInitial) {
                        setIsLocating(false);
                        if (accuracy > 150) {
                            notification.warning({
                                message: 'Low Precision Detected',
                                description: 'Your browser is reporting a wide location margin. If you are in Incognito mode, please try a regular window for better GPS accuracy.',
                                placement: 'bottomRight',
                                duration: 8
                            });
                        } else {
                            notification.success({
                                message: 'Precision Location Set',
                                description: `GPS coordinates verified within ${Math.round(accuracy)} meters.`,
                                placement: 'bottomRight',
                                duration: 4
                            });
                        }
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    if (!isInitial) {
                        setIsLocating(false);
                        notification.error({
                            message: 'Location Error',
                            description: 'Could not access your location. Please ensure site permissions are enabled.'
                        });
                    }
                },
                {
                    enableHighAccuracy: true, // GPS Precision enabled
                    timeout: 15000,           // Increased timeout
                    maximumAge: 0             // Force fresh location, no cache
                }
            );
        }
    };
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    const handlePlaceOrder = async () => {
        if (!selectedAddressCoords) {
            notification.warning({ message: 'Missing Location', description: 'Please confirm your delivery location first.' });
            setCurrentStep(0);
            return;
        }

        setIsPlacingOrder(true);
        try {
            if (!cartItems || cartItems.length === 0) {
                notification.error({
                    message: 'Cart Empty',
                    description: 'Please add items to your cart before placing an order.'
                });
                setIsPlacingOrder(false);
                return;
            }

            const orderData = {
                pharmacyId: cartItems[0]?.pharmacyId || cartItems[0]?.pharmacy?._id || cartItems[0]?.pharmacy,
                items: cartItems.map(item => ({
                    medicine: item._id || item.id,
                    quantity: item.quantity,
                    price: item.priceValue
                })),
                totalAmount: subtotal,
                serviceFee: 50,
                finalAmount: subtotal + 50,
                address: {
                    label: locationLabel,
                    notes: deliveryNotes,
                    coordinates: {
                        latitude: selectedAddressCoords[0],
                        longitude: selectedAddressCoords[1]
                    },
                    geojson: {
                        type: 'Point',
                        coordinates: [selectedAddressCoords[1], selectedAddressCoords[0]] // [long, lat]
                    }
                },
                paymentMethod: paymentMethod
            };

            console.log('[Checkout] Placing Order with data:', JSON.stringify(orderData, null, 2));

            const response = await ordersAPI.createOrder(orderData);

            if (response.data.success) {
                const newOrder = response.data.data;
                setPlacedOrderId(newOrder._id);
                notification.success({
                    message: 'Order Placed',
                    description: `Order #${newOrder.orderNumber} has been successfully placed!`
                });

                // Set success state before clearing cart to avoid "Cart Empty" jump
                setCurrentStep(4);
                clearCart();

                // We stay on step 4 to show the result. User can click "Track" from there.
            } else {
                notification.error({
                    message: 'Order Failed',
                    description: response.data.message || 'Something went wrong while placing your order.'
                });
            }
        } catch (error) {
            console.error('Order failed', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to connect to the server. Please try again later.';
            notification.error({
                message: 'Order Error',
                description: errorMessage
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (currentStep < 4 && (!cartItems || cartItems.length === 0)) {
        return (
            <div className="checkout-container">
                <Card className="checkout-main-card" style={{ textAlign: 'center', padding: '100px 40px' }}>
                    <Result
                        icon={<ShoppingCartOutlined style={{ color: '#E2E8F0', fontSize: '72px' }} />}
                        title="Your cart is empty"
                        subTitle="You need to add medicines to your cart before you can place an order."
                        extra={[
                            <Button type="primary" size="large" key="shop" onClick={() => navigate('/customer/medicines')}>
                                Browse Medicines
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => currentStep > 0 ? handlePrev() : navigate('/customer/cart')}
                style={{ marginBottom: '24px' }}
            >
                {currentStep > 0 ? 'Back to previous step' : 'Back to Cart'}
            </Button>

            <div className="clinical-stepper-wrapper">
                <Steps current={currentStep} items={steps} className="medilink-steps" />
            </div>

            <Row gutter={[32, 32]} style={{ marginTop: '40px' }}>
                {/* Main Flow Content */}
                <Col xs={24} lg={16}>
                    <Card className="checkout-main-card">
                        {currentStep === 0 && (
                            <div className="checkout-step-content fade-in">
                                <Title level={4} style={{ marginBottom: '8px' }}>Delivery Location</Title>
                                <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                                    Point the pin exactly where you want your medicines delivered.
                                </Text>

                                <div className="map-selection-container">
                                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                                    {/* Fixed Center Pin Overlay */}
                                    <div className="fixed-pin-wrapper">
                                        <div className="main-pin">📍</div>
                                        <div className="pin-pulse"></div>
                                    </div>

                                    <div className="map-interaction-hint">
                                        Drag map to adjust position
                                    </div>

                                    <Button
                                        icon={isLocating ? <LoadingOutlined /> : <CompassOutlined />}
                                        className="use-current-loc-btn"
                                        style={{
                                            position: 'absolute',
                                            bottom: '16px',
                                            right: '16px',
                                            zIndex: 1000,
                                            height: '45px',
                                            borderRadius: '22px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onClick={() => handleUseCurrentLocation(false)}
                                        loading={isLocating}
                                    >
                                        {isLocating ? 'Acquiring GPS...' : 'Use Precise GPS'}
                                    </Button>
                                </div>

                                {/* Location Confirmation Bottom Sheet Style */}
                                <div className="location-confirmation-card">
                                    <Row align="middle" gutter={20}>
                                        <Col>
                                            <div className="location-marker-icon">
                                                <CompassOutlined />
                                            </div>
                                        </Col>
                                        <Col flex="auto">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Deliver to:</Text>
                                                {isLocationConfirmed && (
                                                    <Tag color="processing" style={{ borderRadius: '10px', fontSize: '10px', height: '18px', display: 'flex', alignItems: 'center' }}>
                                                        VERIFIED PRECISION
                                                    </Tag>
                                                )}
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined style={{ fontSize: '12px' }} />}
                                                    onClick={() => setIsEditingLabel(!isEditingLabel)}
                                                />
                                            </div>
                                            <div style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                                                {isEditingLabel ? (
                                                    <Input
                                                        value={locationLabel}
                                                        onChange={(e) => setLocationLabel(e.target.value)}
                                                        onBlur={() => setIsEditingLabel(false)}
                                                        onPressEnter={() => setIsEditingLabel(false)}
                                                        autoFocus
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Text strong style={{ fontSize: '15px', color: '#1a202c' }}>{locationLabel}</Text>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    <div style={{ marginTop: '20px' }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Delivery Notes (Gate color, Apt #, etc.)</Text>
                                        <Input.TextArea
                                            placeholder="e.g. Blue gate, apartment 3B, near the big tree"
                                            rows={2}
                                            style={{ marginTop: '8px', borderRadius: '12px' }}
                                            value={deliveryNotes}
                                            onChange={(e) => setDeliveryNotes(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        type="primary"
                                        block
                                        size="large"
                                        className="confirm-location-btn"
                                        style={{ marginTop: '24px' }}
                                        onClick={handleConfirmLocation}
                                        disabled={isLocationConfirmed || locationLabel === 'Locating...'}
                                    >
                                        {isLocationConfirmed ? 'Location Set ✓' : 'Confirm Delivery Location'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="checkout-step-content fade-in">
                                <Title level={4} style={{ marginBottom: '8px' }}>Prescription Verification</Title>
                                <Text type="secondary">Review the prescriptions for your orders.</Text>

                                <div style={{ marginTop: '24px' }}>
                                    {cartItems.filter(item => item.prescriptionRequired).length > 0 ? (
                                        cartItems.filter(item => item.prescriptionRequired).map((item, idx) => (
                                            <Card key={idx} className="prescription-review-item" style={{ marginBottom: '16px' }}>
                                                <Row align="middle" gutter={16}>
                                                    <Col flex="60px">
                                                        <Avatar shape="square" size={48} icon={<MedicineBoxOutlined />} />
                                                    </Col>
                                                    <Col flex="auto">
                                                        <Text strong>{item.name}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Verified Prescription: Included</Text>
                                                    </Col>
                                                    <Col>
                                                        <Tag color="success" icon={<CheckCircleFilled />}>Attached</Tag>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))
                                    ) : (
                                        <Alert
                                            message="No Prescriptions Required"
                                            description="None of the items in your cart require a prescription."
                                            type="info"
                                            showIcon
                                            style={{ marginBottom: '24px' }}
                                        />
                                    )}

                                    {cartItems.filter(item => item.prescriptionRequired).length > 0 && (
                                        <Alert
                                            message="All prescriptions are ready"
                                            description="You have provided valid prescriptions for required items."
                                            type="success"
                                            showIcon
                                            style={{ marginTop: '24px', borderRadius: '12px' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="checkout-step-content fade-in">
                                <Title level={4} style={{ marginBottom: '24px' }}>Payment Method</Title>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {[
                                            { id: 'telebirr', name: 'Telebirr', desc: 'Secure mobile payment by Ethio Telecom' },
                                            { id: 'cbe', name: 'CBE Birr', desc: 'Quick payment via Commercial Bank of Ethiopia' },
                                            { id: 'cash', name: 'Cash on Delivery', desc: 'Pay when your medicine arrives' },
                                        ].map(pm => (
                                            <Card
                                                key={pm.id}
                                                className={`payment-option-card ${paymentMethod === pm.id ? 'selected' : ''}`}
                                                onClick={() => setPaymentMethod(pm.id)}
                                            >
                                                <Row align="middle">
                                                    <Col flex="40px">
                                                        <Radio value={pm.id} />
                                                    </Col>
                                                    <Col flex="auto">
                                                        <Text strong style={{ fontSize: '16px' }}>{pm.name}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>{pm.desc}</Text>
                                                    </Col>
                                                    <Col>
                                                        <div className="payment-icon-placeholder" />
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="checkout-step-content fade-in">
                                <Title level={4} style={{ marginBottom: '24px' }}>Review & Place Order</Title>
                                <Card type="inner" title="Order Details" className="review-inner-card">
                                    <div className="review-stat">
                                        <Text type="secondary">Delivery To:</Text>
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <Text strong>{locationLabel}</Text>
                                        </div>
                                        {deliveryNotes && (
                                            <div style={{ marginTop: '4px' }}>
                                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                                    <MessageOutlined style={{ marginRight: '8px' }} />
                                                    "{deliveryNotes}"
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div className="review-stat">
                                        <Text type="secondary">Payment via:</Text>
                                        <Text strong>{paymentMethod.toUpperCase()}</Text>
                                    </div>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div className="review-stat" style={{ display: 'block' }}>
                                        <Text type="secondary">Items:</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            {cartItems.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <Text>{item.name} x{item.quantity}</Text>
                                                    <Text>{item.priceValue * item.quantity} ETB</Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <div style={{ marginTop: '24px' }}>
                                    <Paragraph type="secondary" style={{ fontSize: '13px' }}>
                                        By placing this order, you agree to MediLink's patient terms of service and clinical compliance guidelines.
                                    </Paragraph>
                                </div>
                            </div>
                        )}

                        <div className="checkout-footer-actions">
                            {currentStep < 3 ? (
                                <Button type="primary" size="large" onClick={handleNext} block className="step-btn">
                                    Continue
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handlePlaceOrder}
                                    block
                                    className="place-order-btn"
                                    loading={isPlacingOrder}
                                    disabled={isPlacingOrder}
                                >
                                    Place Order
                                </Button>
                            )}
                        </div>
                    </Card>
                </Col>

                {/* Summary Col */}
                <Col xs={24} lg={8}>
                    <Card className="checkout-summary-sidebar">
                        <Title level={4} style={{ marginBottom: '24px' }}>Order Total</Title>
                        <div className="price-breakdown">
                            <div className="p-row"><span>Items</span><span>{subtotal.toFixed(2)} ETB</span></div>
                            <div className="p-row"><span>Delivery</span><span>50.00 ETB</span></div>
                        </div>
                        <Divider />
                        <div className="total-display">
                            <Text strong>Payment Amount</Text>
                            <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>{(subtotal + 50).toFixed(2)} ETB</Title>
                        </div>
                    </Card>
                </Col>
            </Row>

            {currentStep === 4 && (
                <div className="success-overlay fade-in">
                    <Result
                        status="success"
                        title="Order Placed Successfully!"
                        subTitle="Your order is being processed by the pharmacy."
                        extra={[
                            <Button type="primary" key="track" onClick={() => navigate(`/customer/orders/track/${placedOrderId}`)}>
                                Track Order Live
                            </Button>,
                            <Button key="orders" onClick={() => navigate('/customer/orders')}>
                                Go to My Orders
                            </Button>,
                        ]}
                    />
                </div>
            )}
        </div>
    );
};

export default Checkout;
