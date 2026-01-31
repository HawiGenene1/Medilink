import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Card,
    Descriptions,
    Button,
    Spin,
    Alert,
    Radio,
    Space,
    Typography,
    Divider,
    Tag,
    List,
    message
} from 'antd';
import {
    CreditCardOutlined,
    MobileOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import './PaymentBoard.css';

const { Title, Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PaymentBoard = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('telebirr');

    useEffect(() => {
        fetchOrderDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                setPayment(data.data.payment);

                // If payment already completed, redirect to status page
                if (data.data.paymentStatus === 'paid') {
                    message.success('This order has already been paid');
                    navigate(`/customer/orders`);
                }
            } else {
                setError(data.message || 'Failed to load order details');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayWithChapa = async () => {
        try {
            setSubmitting(true);
            setError(null);

            const returnUrl = `${window.location.origin}/customer/orders/${orderId}/payment-status`;

            const response = await fetch(`${API_URL}/chapa/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    orderId: order._id,
                    paymentMethod: paymentMethod,
                    returnUrl: returnUrl
                })
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                // Redirect to Chapa checkout page
                window.location.href = data.checkoutUrl;
            } else {
                setError(data.message || 'Failed to initialize payment');
                message.error('Payment initialization failed');
            }
        } catch (err) {
            console.error('Payment initialization error:', err);
            setError('Failed to initialize payment. Please try again.');
            message.error('Payment initialization failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            pending: { color: 'orange', text: 'Pending Payment' },
            paid: { color: 'green', text: 'Paid' },
            failed: { color: 'red', text: 'Failed' },
            cancelled: { color: 'default', text: 'Cancelled' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    if (loading) {
        return (
            <div className="payment-board-loading">
                <Spin size="large" />
                <p>Loading payment details...</p>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="payment-board-container">
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button onClick={() => navigate('/customer/orders')}>
                            Back to Orders
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="payment-board-container">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/customer/orders')}
                style={{ marginBottom: 16 }}
            >
                Back to Orders
            </Button>

            <Card className="payment-board-card">
                <div className="payment-board-header">
                    <Title level={3}>
                        <CreditCardOutlined /> Payment Board
                    </Title>
                    {getPaymentStatusTag(order?.paymentStatus)}
                </div>

                <Divider />

                {/* Order Summary */}
                <div className="order-summary-section">
                    <Title level={4}>Order Summary</Title>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Order Number">
                            <Text strong>{order?.orderNumber}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Pharmacy">
                            {order?.pharmacy?.name || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Order Status">
                            <Tag color="blue">{order?.status?.toUpperCase()}</Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    {/* Medicine Items */}
                    <div style={{ marginTop: 20 }}>
                        <Text strong>Ordered Medicines:</Text>
                        <List
                            dataSource={order?.items || []}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.name || item.medicine?.name}
                                        description={`Quantity: ${item.quantity} × ETB ${item.price} = ETB ${item.subtotal}`}
                                    />
                                </List.Item>
                            )}
                            style={{ marginTop: 10 }}
                        />
                    </div>

                    {/* Amount Breakdown */}
                    <Card className="amount-breakdown" style={{ marginTop: 20 }}>
                        <div className="amount-row">
                            <Text>Subtotal</Text>
                            <Text>ETB {order?.totalAmount?.toFixed(2)}</Text>
                        </div>
                        <div className="amount-row">
                            <Text>Delivery Fee</Text>
                            <Text>ETB {order?.deliveryFee?.toFixed(2)}</Text>
                        </div>
                        <div className="amount-row">
                            <Text>Tax</Text>
                            <Text>ETB {order?.tax?.toFixed(2)}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div className="amount-row total">
                            <Title level={4} style={{ margin: 0 }}>Total Amount</Title>
                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                ETB {order?.finalAmount?.toFixed(2)}
                            </Title>
                        </div>
                    </Card>
                </div>

                <Divider />

                {/* Payment Method Selection */}
                {order?.paymentStatus !== 'paid' && (
                    <div className="payment-method-section">
                        <Title level={4}>Select Payment Method</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            Choose your preferred payment provider
                        </Text>

                        <Radio.Group
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="payment-method-options"
                        >
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Radio value="telebirr">
                                    <Space>
                                        <MobileOutlined />
                                        <span>Telebirr</span>
                                    </Space>
                                </Radio>
                                <Radio value="cbebirr">
                                    <Space>
                                        <MobileOutlined />
                                        <span>CBE Birr</span>
                                    </Space>
                                </Radio>
                                <Radio value="mpesa">
                                    <Space>
                                        <MobileOutlined />
                                        <span>M-Pesa</span>
                                    </Space>
                                </Radio>
                                <Radio value="amole">
                                    <Space>
                                        <MobileOutlined />
                                        <span>Amole</span>
                                    </Space>
                                </Radio>
                                <Radio value="card">
                                    <Space>
                                        <CreditCardOutlined />
                                        <span>Credit/Debit Card</span>
                                    </Space>
                                </Radio>
                            </Space>
                        </Radio.Group>

                        {error && (
                            <Alert
                                message="Payment Error"
                                description={error}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setError(null)}
                                style={{ marginTop: 16 }}
                            />
                        )}

                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={submitting ? <LoadingOutlined /> : <CheckCircleOutlined />}
                            onClick={handlePayWithChapa}
                            loading={submitting}
                            disabled={submitting}
                            style={{ marginTop: 24 }}
                        >
                            {submitting ? 'Redirecting to Chapa...' : 'Pay with Chapa'}
                        </Button>

                        <div className="payment-security-notice" style={{ marginTop: 16 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                🔒 Secure payment powered by Chapa. Your payment information is encrypted and secure.
                            </Text>
                        </div>
                    </div>
                )}

                {/* Payment Already Completed */}
                {order?.paymentStatus === 'paid' && payment && (
                    <div className="payment-completed-section">
                        <Alert
                            message="Payment Completed"
                            description={
                                <div>
                                    <p>This order has been successfully paid.</p>
                                    <p>Transaction ID: <Text code>{payment.transactionId}</Text></p>
                                    <p>
                                        Paid at: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            }
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                        />

                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                            <Button onClick={() => navigate('/customer/orders')}>
                                View Orders
                            </Button>
                            <Button type="primary" onClick={() => navigate(`/customer/orders/${orderId}/invoice`)}>
                                View Invoice
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentBoard;
