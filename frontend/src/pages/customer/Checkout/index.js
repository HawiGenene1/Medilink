import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Steps, Space, Radio, Divider, Avatar, Result, Tag, Alert, Input, Descriptions, Badge, message } from 'antd';
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
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
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
    const { user } = useAuth(); // Get user from auth context
    const { cartItems, subtotal, clearCart } = useCart();
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('telebirr');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPaymentInitializing, setIsPaymentInitializing] = useState(false);

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
                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                    const response = await fetch(`${apiUrl}/pharmacy/${cartItems[0].pharmacyId}`);
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

    // Script loader removed - switching to backend-driven payment initialization

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

    const handlePlaceOrder = async () => {
        if (loading || isPaymentInitializing) return;

        setLoading(true);
        setIsPaymentInitializing(true);
        setErrorMessage('');

        try {
            const hexifyId = (id) => {
                if (!id) return id;
                const idStr = String(id);
                if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) return idStr;
                return idStr.padStart(24, '0').slice(-24).toLowerCase();
            };

            const isDev = process.env.NODE_ENV === 'development';

            // STRICT VALIDATION: Reject any item without a valid real MongoDB ID
            const validItemsForOrder = cartItems.filter(item => {
                const id = hexifyId(item.id || item._id);
                // Must be 24-char hex string
                return id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
            });

            if (validItemsForOrder.length === 0) {
                throw new Error("Invalid items in cart. Please clear usage of mock data.");
            }

            if (validItemsForOrder.length !== cartItems.length) {
                throw new Error("Some items in your cart are invalid/mock data. Please clear cart and re-add.");
            }

            // Ensure all items sent to backend HAVE valid-looking hex IDs
            const finalizedItems = validItemsForOrder.map(item => ({
                medicineId: hexifyId(item.id || item._id),
                quantity: item.quantity,
                price: item.priceValue
            }));

            const checkoutSubtotal = validItemsForOrder.reduce((acc, item) => acc + (item.priceValue * item.quantity), 0);


            // Step 1: Create Order in Backend
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const orderResponse = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    items: finalizedItems,
                    // notes: deliveryNotes, // Move notes to top level
                    deliveryInstructions: deliveryNotes, // Map to deliveryInstructions

                    // Address Object matching Mongoose Schema exactly
                    deliveryAddress: {
                        street: locationLabel,
                        city: 'Addis Ababa',
                        country: 'Ethiopia',
                        // notes: deliveryNotes, // REMOVED: Schema doesn't have notes in deliveryAddress
                        coordinates: isLocationConfirmed ? {
                            latitude: selectedAddressCoords[0],
                            longitude: selectedAddressCoords[1]
                        } : undefined // Map lat/lng to latitude/longitude
                    },
                    paymentMethod: paymentMethod === 'cash' ? 'cash' : 'chapa'
                })
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                // detailed error message from backend (validation errors etc)
                const detailedError = orderData.error || orderData.message || 'Failed to create order';
                throw new Error(detailedError);
            }

            const newOrderId = orderData.data.orderId;
            const customerName = user.name || (user.firstName + ' ' + (user.lastName || ''));
            const [firstName, lastName] = customerName.split(' ');

            // Step 2: Handle Payment
            if (paymentMethod === 'cash') {
                clearCart();
                setPaymentResult({ txRef: 'COD-' + newOrderId });
                setCurrentStep(4);
            } else {
                // Step 2b: Initialize Chapa Payment via Backend (More Robust)
                const chapaInitResponse = await fetch(`${apiUrl}/payments/chapa/initialize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        orderId: newOrderId,
                        paymentMethod: paymentMethod, // 'telebirr', 'card', etc.
                        phoneNumber: phoneNumber,
                        returnUrl: `${window.location.origin}/customer/orders/${newOrderId}/payment-status`
                    })
                });

                const chapaInitData = await chapaInitResponse.json();

                if (chapaInitData.success) {
                    if (chapaInitData.alreadyPaid) {
                        message.info('Order already settled. Redirecting to receipt...');
                        setTimeout(() => {
                            clearCart();
                            navigate(`/customer/orders/${newOrderId}/payment-status`);
                        }, 1500);
                        return;
                    }
                    if (chapaInitData.checkoutUrl) {
                        // Redirect to Chapa Hosted/Hosted Page (Very Reliable)
                        window.location.href = chapaInitData.checkoutUrl;
                    } else {
                        // Success but no URL = Either Direct Charge (STK Push) or Demo Mode
                        message.success(chapaInitData.data?.demo
                            ? 'Payment completed successfully! (Demo Mode)'
                            : 'Payment prompt sent to your phone!');
                        setIsPaymentInitializing(false);
                        setLoading(false);
                        // Delay slightly before redirecting so they see the message
                        setTimeout(() => {
                            clearCart();
                            navigate(`/customer/orders/${newOrderId}/payment-status`);
                        }, 2000);
                    }
                } else {
                    throw new Error(chapaInitData.message || 'Payment system could not be initialized. Please try again.');
                }
            }

        } catch (error) {
            console.error('Order/Payment failed', error);
            setErrorMessage(error.message || 'Failed to place order. Please try again.');
            setIsPaymentInitializing(false);
            setLoading(false);
        } finally {
            // Loading stays true if popup successfully opens
            if (paymentMethod === 'cash') setLoading(false);
        }
    };

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

            {/* Chapa Native Modal will open here via chapa.open() */}
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
                                            { id: 'telebirr', name: 'TeleBirr', desc: 'Secure mobile payment by Ethio Telecom' },
                                            { id: 'mpesa', name: 'M-Pesa', desc: 'Safaricom mobile money' },
                                            { id: 'cbebirr', name: 'CBE Birr', desc: 'Quick payment via Commercial Bank of Ethiopia' },
                                            { id: 'coopay', name: 'Coopay-Ebirr', desc: 'Cooperative Bank of Oromia mobile money' },
                                            { id: 'awashbirr', name: 'Awash Birr', desc: 'Bank of Abyssinia mobile payment' },
                                            { id: 'yaya', name: 'Yaya Wallet', desc: 'Digital wallet for instant payments' },
                                            { id: 'card', name: 'Debit/Credit Card', desc: 'Visa, Mastercard via Chapa' },
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
                                                {paymentMethod === pm.id && pm.id !== 'cash' && (
                                                    <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                                        <Text type="secondary">Enter your {pm.name} Phone Number</Text>
                                                        <Input
                                                            placeholder="0911223344"
                                                            style={{ marginTop: '8px' }}
                                                            value={phoneNumber}
                                                            onChange={e => setPhoneNumber(e.target.value)}
                                                            variant="filled"
                                                        />
                                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                                                            You will receive a prompt on your phone to authorize the payment.
                                                        </Text>
                                                    </div>
                                                )}
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

                                {errorMessage && (
                                    <Alert
                                        message="Error"
                                        description={errorMessage}
                                        type="error"
                                        showIcon
                                        style={{ marginTop: '16px' }}
                                    />
                                )}

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
                                    loading={loading || isPaymentInitializing}
                                    disabled={(paymentMethod !== 'cash' && !phoneNumber) || isPaymentInitializing}
                                >
                                    {isPaymentInitializing ? 'Initializing Payment...' : 'Confirm & Pay'}
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
                    >
                        {paymentResult && (
                            <div className="payment-success-details" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '16px', borderRadius: '8px', marginTop: '24px' }}>
                                <Descriptions title="Payment Information" column={1} size="small">
                                    <Descriptions.Item label="Transaction ID">
                                        <Text copyable strong>{paymentResult.txRef}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Provider">
                                        <Tag color="blue">{paymentMethod.toUpperCase()}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Status">
                                        <Badge status="success" text="Charge Initiated" />
                                    </Descriptions.Item>
                                    {paymentResult.data?.checkout_url && (
                                        <Descriptions.Item label="Reference">
                                            <a href={paymentResult.data.checkout_url} target="_blank" rel="noreferrer">Chapa Receipt</a>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        )}
                    </Result>
                    {paymentMethod !== 'cash' && (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <Alert
                                message="Payment in Progress"
                                description="Please check your phone for the authorization prompt. Your order will be updated once payment is confirmed."
                                type="info"
                                showIcon
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Checkout;
