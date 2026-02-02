import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Alert, Button, Spin, message, Radio, Input, Space, Form } from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined, MobileOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrderCheckout = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);

    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setOrder(data.data);
            } else {
                setError(data.message || 'Failed to fetch order details');
            }
        } catch (err) {
            setError('Failed to load order details');
            console.error('Fetch order error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!phoneNumber && paymentMethod !== 'card') {
            message.error('Please enter a phone number for mobile payment');
            return;
        }

        // Validate phone format if provided (starts with 09 or 07, 10 digits)
        if (phoneNumber && !/^(09|07)\d{8}$/.test(phoneNumber)) {
            message.error('Invalid phone number. Must start with 09 or 07 and be 10 digits long.');
            return;
        }

        try {
            setInitializing(true);

            // Call backend API to initialize Chapa payment
            const response = await fetch(`${API_URL}/payments/chapa/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    orderId: orderId,
                    returnUrl: `${window.location.origin}/customer/orders/${orderId}/payment-status`,
                    paymentMethod: paymentMethod,
                    phoneNumber: phoneNumber
                })
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                // Redirect to Chapa checkout page
                window.location.href = data.checkoutUrl;
            } else {
                message.error(data.message || 'Failed to initialize payment');
                setInitializing(false);
            }
        } catch (err) {
            console.error('Payment initialization error:', err);
            message.error('Failed to initialize payment. Please try again.');
            setInitializing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Card style={{ maxWidth: 600, margin: '40px auto' }}>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    }
                />
            </Card>
        );
    }

    if (!order) {
        return (
            <Card style={{ maxWidth: 600, margin: '40px auto' }}>
                <Alert
                    message="Order Not Found"
                    description="The order you're looking for doesn't exist."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
        return (
            <Card style={{ maxWidth: 600, margin: '40px auto' }}>
                <Alert
                    message="Already Paid"
                    description="This order has already been paid."
                    type="success"
                    showIcon
                    action={
                        <Button onClick={() => navigate('/customer/orders')}>
                            View Orders
                        </Button>
                    }
                />
            </Card>
        );
    }

    // Order summary and confirmation
    const itemColumns = [
        {
            title: 'Medicine',
            dataIndex: ['medicine', 'name'],
            key: 'medicine',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `ETB ${price?.toFixed(2)}`
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (subtotal) => `ETB ${subtotal?.toFixed(2)}`
        }
    ];

    return (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ marginBottom: 16 }}
                disabled={initializing}
            >
                Back
            </Button>

            <Card title={`Order Checkout - ${order.orderNumber}`}>
                {initializing && (
                    <Alert
                        message="Initializing Payment"
                        description="Please wait while we prepare your payment. You will be redirected to the payment page..."
                        type="info"
                        showIcon
                        icon={<Spin />}
                        style={{ marginBottom: 24 }}
                    />
                )}

                {!initializing && (
                    <Alert
                        message="Review Your Order"
                        description="Please review your order details before proceeding to payment."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Order Number" span={2}>
                        {order.orderNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                        {order.customer?.firstName || order.customer?.name?.split(' ')[0]} {order.customer?.lastName || order.customer?.name?.split(' ').slice(1).join(' ')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                        {order.customer?.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                        {order.customer?.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {order.status}
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Address" span={2}>
                        {order.deliveryAddress || 'N/A'}
                    </Descriptions.Item>
                </Descriptions>

                <h3>Order Items</h3>
                <Table
                    columns={itemColumns}
                    dataSource={order.items}
                    rowKey="_id"
                    pagination={false}
                    style={{ marginBottom: 24 }}
                    summary={() => (
                        <Table.Summary>
                            <Table.Summary.Row>
                                <Table.Summary.Cell colSpan={3} align="right">
                                    <strong>Total Amount:</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                    <strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                        ETB {order.finalAmount?.toFixed(2)}
                                    </strong>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />

                <div style={{ marginBottom: 24 }}>
                    <h3>Select Payment Method</h3>
                    <Radio.Group
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        value={paymentMethod}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <Radio value="card" className="payment-radio">
                            <Space>
                                <CreditCardOutlined />
                                <span>Credit/Debit Card</span>
                            </Space>
                        </Radio>
                        <Radio value="telebirr" className="payment-radio">
                            <Space>
                                <MobileOutlined />
                                <span>Telebirr</span>
                            </Space>
                        </Radio>
                        <Radio value="mpesa" className="payment-radio">
                            <Space>
                                <MobileOutlined />
                                <span>M-Pesa</span>
                            </Space>
                        </Radio>
                        <Radio value="cbebirr" className="payment-radio">
                            <Space>
                                <BankOutlined />
                                <span>CBEBirr</span>
                            </Space>
                        </Radio>
                    </Radio.Group>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <h3>Phone Number for Payment</h3>
                    <Form layout="vertical">
                        <Form.Item
                            label="Enter Phone Number"
                            required
                            tooltip="Required for mobile money payments, optional for card."
                        >
                            <Input
                                placeholder="e.g., 0911234567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                prefix={<MobileOutlined />}
                                size="large"
                            />
                        </Form.Item>
                    </Form>
                </div>

                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleProceedToPayment}
                        loading={initializing}
                        disabled={initializing}
                        style={{ minWidth: 200 }}
                    >
                        {initializing ? 'Initializing Payment...' : `Proceed to Payment - ETB ${order.finalAmount?.toFixed(2)}`}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default OrderCheckout;
