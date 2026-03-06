import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Steps, Space, Radio, Divider, Avatar, Badge, Result, Tag, Alert, Input } from 'antd';
import {
    EnvironmentOutlined,
    SafetyCertificateOutlined,
    CreditCardOutlined,
    CarryOutOutlined,
    CheckCircleFilled,
    MedicineBoxOutlined,
    ArrowLeftOutlined,
    CompassOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { ordersAPI } from '../../../services/api/orders';
import { message, Spin } from 'antd';
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
    const [loading, setLoading] = useState(false);

    // Mock Data
    const addresses = [
        { id: 'addr-1', label: 'Home', fullAddress: 'Bole, House 456, Addis Ababa', isDefault: true },
        { id: 'addr-2', label: 'Office', fullAddress: 'Kazanchis, Nani Building 4th Floor, Addis Ababa', isDefault: false },
    ];

    const [selectedAddress, setSelectedAddress] = useState('addr-1');
    const [paymentMethod, setPaymentMethod] = useState('chapa');

    // Location State
    const [mapCenter, setMapCenter] = useState([9.0227, 38.7460]); // Addis Ababa default
    const [locationLabel, setLocationLabel] = useState('Locating...');
    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [selectedAddressCoords, setSelectedAddressCoords] = useState(null);

    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const geocodeTimeout = useRef(null);

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
            const address = data.display_name.split(',').slice(0, 2).join(',');
            setLocationLabel(address || 'Unknown Location');
        } catch (error) {
            console.error('Geocoding failed:', error);
            setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    };

    // Initialize Map for Step 0
    useEffect(() => {
        if (currentStep === 0 && mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(mapCenter, 16);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

            // Add Soft Blue Theme class to container
            mapRef.current.classList.add('soft-blue-map');

            // Handle Map Movement
            mapInstance.current.on('move', () => {
                const center = mapInstance.current.getCenter();
                setMapCenter([center.lat, center.lng]);
                setIsLocationConfirmed(false); // Reset confirmation on move

                // Debounced Geocoding
                if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
                geocodeTimeout.current = setTimeout(() => {
                    reverseGeocode(center.lat, center.lng);
                }, 800);
            });

            // Initial geocode
            reverseGeocode(mapCenter[0], mapCenter[1]);
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

    const handleUseCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                mapInstance.current.flyTo([latitude, longitude], 17);
            });
        }
    };
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    const [showChapa, setShowChapa] = useState(false);

    // Load Chapa Inline Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://js.chapa.co/v1/inline.js";
        script.crossOrigin = "anonymous"; // Enable error details for cross-origin scripts
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePlaceOrder = async () => {
        try {
            setLoading(true);
            const address = addresses.find(a => a.id === selectedAddress);

            // 1. Create Order
            const orderPayload = {
                items: cartItems.map(item => ({
                    medicineId: item.id || item._id, // Handle both id formats
                    quantity: item.quantity,
                    price: item.priceValue
                })),
                shippingAddress: locationLabel, // Use confirmed location label
                paymentMethod: paymentMethod === 'cash' ? 'cash' : 'chapa',
                deliveryFee: 50,
                coordinates: {
                    latitude: selectedAddressCoords[0],
                    longitude: selectedAddressCoords[1]
                }
            };

            const orderRes = await ordersAPI.createOrder(orderPayload);
            const order = orderRes.data.data || orderRes.data;
            const orderId = order._id || order.id || order.orderId;

            if (!orderId) throw new Error('Failed to create order');

            // 2. Handle Payment Flow
            if (paymentMethod === 'cash') {
                // Cash on Delivery - Bypass Chapa
                clearCart();
                setCurrentStep(4); // Show success overlay
                setLoading(false);
                message.success('Order placed successfully! Cash on Delivery selected.');
                return;
            }

            // Chapa Initialization
            const paymentPayload = {
                orderId: orderId,
                amount: subtotal + 50,
                paymentMethod: paymentMethod, // provider
                returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
                phoneNumber: '0911234567'
            };

            const paymentRes = await ordersAPI.initializeChapaPayment(paymentPayload);

            if (paymentRes.data.success) {
                // 3. Initialize Chapa Inline
                clearCart();
                setShowChapa(true); // Hide our button, show Chapa container
                setLoading(false);

                // Debug logging
                if (window.ChapaCheckout) {
                    try {
                        if (!paymentRes.data.publicKey) {
                            throw new Error('Chapa Public Key is missing from backend response');
                        }

                        const chapa = new window.ChapaCheckout({
                            publicKey: paymentRes.data.publicKey,
                            amount: (subtotal + 50).toString(),
                            currency: 'ETB',
                            tx_ref: paymentRes.data.txRef, // Link to backend payment
                            email: "israel@negade.et", // TODO: Get from user profile
                            first_name: "Israel",
                            last_name: "Goytom",
                            title: "Medilink Payment",
                            description: `Payment for Order ${order.orderNumber}`,
                            callbackUrl: "https://example.com/callbackurl", // Optional
                            returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
                            customizations: {
                                buttonText: 'Pay Now',
                                styles: `
                                    .chapa-pay-button { 
                                        background-color: #1890ff; 
                                        color: white;
                                        width: 100%;
                                        padding: 10px;
                                        border-radius: 4px;
                                        font-weight: bold;
                                        cursor: pointer;
                                    }
                                    .chapa-pay-button:hover {
                                        background-color: #40a9ff;
                                    }
                                `
                            }
                        });
                        chapa.initialize('chapa-inline-form');
                    } catch (chapaError) {
                        console.error('Chapa Constructor Error:', chapaError);
                        message.error(`Payment System Error: ${chapaError.message}`);
                        setShowChapa(false); // Re-enable Pay button
                    }
                } else {
                    message.error("Payment gateway script not loaded. Please refresh.");
                    setShowChapa(false);
                }

            } else {
                throw new Error('Payment initialization failed');
            }

        } catch (error) {
            console.error('Checkout Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to place order. Please try again.';
            if (error.response?.data?.errors) {
                message.error(error.response.data.errors.map(e => e.msg).join(', '));
            } else {
                message.error(errorMsg);
            }
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            {/* Chapa Inline Container */}
            <div id="chapa-inline-form" style={{ marginTop: 20 }}></div>

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
                                        icon={<CompassOutlined />}
                                        className="use-current-loc-btn"
                                        style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000 }}
                                        onClick={handleUseCurrentLocation}
                                    >
                                        Use My Current Location
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
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Deliver to:</Text>
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <Text strong style={{ fontSize: '16px' }}>{locationLabel}</Text>
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
                                            {
                                                id: 'chapa',
                                                name: 'Secure Online Payment (Chapa)',
                                                desc: 'Pay via Telebirr, CBE Birr, Amole, Awash, or Card'
                                            },
                                            {
                                                id: 'cash',
                                                name: 'Cash on Delivery',
                                                desc: 'Pay when your medicine arrives'
                                            },
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
                                                        <div className="payment-icon-placeholder" style={{
                                                            backgroundImage: pm.id === 'chapa' ? 'url(https://chapa.co/assets/img/chapa-logo.png)' : 'none',
                                                            backgroundSize: 'contain',
                                                            backgroundRepeat: 'no-repeat',
                                                            backgroundPosition: 'center'
                                                        }} />
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
                                <Button type="primary" size="large" onClick={handlePlaceOrder} block className="place-order-btn" loading={loading} disabled={showChapa}>
                                    Pay & Place Order
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
                            <Button type="primary" key="track" onClick={() => navigate('/customer/orders/track/ORD-LATEST')}>
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
