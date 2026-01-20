import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Steps, Space, Radio, Divider, Avatar, Badge, Result, Tag, Alert } from 'antd';
import {
    EnvironmentOutlined,
    SafetyCertificateOutlined,
    CreditCardOutlined,
    CarryOutOutlined,
    CheckCircleFilled,
    MedicineBoxOutlined,
    PlusOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import './Checkout.css';

const { Title, Text, Paragraph } = Typography;

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, subtotal, clearCart } = useCart();
    const [currentStep, setCurrentStep] = useState(0);

    // Mock Data
    const addresses = [
        { id: 'addr-1', label: 'Home', fullAddress: 'Bole, House 456, Addis Ababa', isDefault: true },
        { id: 'addr-2', label: 'Office', fullAddress: 'Kazanchis, Nani Building 4th Floor, Addis Ababa', isDefault: false },
    ];

    const [selectedAddress, setSelectedAddress] = useState('addr-1');
    const [paymentMethod, setPaymentMethod] = useState('telebirr');

    const steps = [
        { title: 'Address', icon: <EnvironmentOutlined /> },
        { title: 'Prescription', icon: <SafetyCertificateOutlined /> },
        { title: 'Payment', icon: <CreditCardOutlined /> },
        { title: 'Review', icon: <CarryOutOutlined /> },
    ];

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    const handlePlaceOrder = () => {
        // Here you would integrate with backend
        clearCart();
        setCurrentStep(4);
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

            <Row gutter={[32, 32]} style={{ marginTop: '40px' }}>
                {/* Main Flow Content */}
                <Col xs={24} lg={16}>
                    <Card className="checkout-main-card">
                        {currentStep === 0 && (
                            <div className="checkout-step-content fade-in">
                                <Title level={4} style={{ marginBottom: '24px' }}>Select Delivery Address</Title>
                                <Radio.Group
                                    value={selectedAddress}
                                    onChange={e => setSelectedAddress(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {addresses.map(addr => (
                                            <Card
                                                key={addr.id}
                                                className={`address-option-card ${selectedAddress === addr.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedAddress(addr.id)}
                                            >
                                                <Row align="middle">
                                                    <Col flex="40px">
                                                        <Radio value={addr.id} />
                                                    </Col>
                                                    <Col flex="auto">
                                                        <div>
                                                            <Space>
                                                                <Text strong style={{ fontSize: '16px' }}>{addr.label}</Text>
                                                                {addr.isDefault && <Badge count="Default" style={{ backgroundColor: '#E0E7FF', color: '#4338CA', fontSize: '10px' }} />}
                                                            </Space>
                                                            <br />
                                                            <Text type="secondary">{addr.fullAddress}</Text>
                                                        </div>
                                                    </Col>
                                                    <Col>
                                                        <Button type="link">Edit</Button>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                        <Button type="dashed" block icon={<PlusOutlined />} className="add-address-btn">
                                            Add New Address
                                        </Button>
                                    </Space>
                                </Radio.Group>
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
                                        <Text strong>{addresses.find(a => a.id === selectedAddress)?.label} - {addresses.find(a => a.id === selectedAddress)?.fullAddress}</Text>
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
                                <Button type="primary" size="large" onClick={handlePlaceOrder} block className="place-order-btn">
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
                        subTitle="Your order #ORD-8829 is being processed by Kenema Pharmacy."
                        extra={[
                            <Button type="primary" key="track" onClick={() => navigate('/customer/orders')}>Track My Order</Button>,
                            <Button key="home" onClick={() => navigate('/customer/dashboard')}>Back to Dashboard</Button>,
                        ]}
                    />
                </div>
            )}
        </div>
    );
};

export default Checkout;
