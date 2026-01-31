import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Result, Button, Spin, Descriptions, Alert, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PaymentStatus = () => {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState(null);
    const [paymentRef, setPaymentRef] = useState(null); // Chapa Reference for Receipt
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        // Get status from URL params (Chapa redirect)
        const status = searchParams.get('status');
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');

        if (status && txRef) {
            verifyPayment(txRef, transactionId, status);
        } else {
            checkOrderStatus();
        }
    }, [orderId, searchParams]);

    const verifyPayment = async (txRef, transactionId, status) => {
        try {
            setVerifying(true);

            // Call backend to verify payment with Chapa
            // Endpoint: GET /api/payments/chapa/verify/:txRef
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payments/chapa/verify/${txRef}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setPaymentStatus(data.data.status);
                setPaymentRef(data.data.reference); // Capture Chapa Reference
                setPaymentDetails(data.data); // Capture full details for display
                // Fetch updated order details to ensure we display them
                checkOrderStatus();
            } else {
                setError(data.message || 'Payment verification failed');
                setPaymentStatus('failed');
            }
        } catch (err) {
            console.error('Payment verification error:', err);
            setError('Failed to verify payment');
            setPaymentStatus('failed');
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const checkOrderStatus = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setOrder(data.data);
                // Only update payment status if not already set by verification
                if (!paymentStatus) {
                    setPaymentStatus(data.data.paymentStatus === 'paid' ? 'success' : 'pending');
                }
            } else {
                setError(data.message || 'Failed to fetch order status');
            }
        } catch (err) {
            console.error('Fetch order error:', err);
            setError('Failed to check order status');
        } finally {
            setLoading(false);
        }
    };

    if (loading || verifying) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>
                    {verifying ? 'Verifying your payment...' : 'Loading...'}
                </p>
            </div>
        );
    }

    const renderPaymentResult = () => {
        switch (paymentStatus) {
            case 'success':
            case 'completed':
                return (
                    <Result
                        status="success"
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Payment Successful!"
                        subTitle={`Your payment for order ${order?.orderNumber} has been processed successfully.`}
                        extra={[
                            paymentRef && (
                                <Button
                                    key="receipt"
                                    type="primary"
                                    onClick={() => window.open(`https://chapa.link/payment-receipt/${paymentRef}`, '_blank')}
                                    style={{ backgroundColor: '#00af41', borderColor: '#00af41' }}
                                >
                                    View Official Chapa Receipt
                                </Button>
                            ),
                            <Button key="invoice" onClick={() => navigate(`/customer/orders/${orderId}/invoice`)}>
                                Medilink Invoice
                            </Button>,
                            <Button key="orders" onClick={() => navigate('/customer/orders')}>
                                View My Orders (History)
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Home
                            </Button>
                        ]}
                    >
                        <Alert
                            message="Persistent Success Page"
                            description="This page will remain active for at least 5 minutes. You can also always find your official Chapa receipt in the 'My Orders' history page later."
                            type="success"
                            showIcon
                            style={{ marginTop: 24, borderRadius: 12 }}
                        />
                    </Result>
                );

            case 'failed':
                return (
                    <Result
                        status="error"
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title="Payment Failed"
                        subTitle={error || 'Your payment could not be processed. Please try again.'}
                        extra={[
                            <Button type="primary" key="retry" onClick={() => navigate(`/customer/orders/${orderId}/checkout`)}>
                                Try Again
                            </Button>,
                            <Button key="orders" onClick={() => navigate('/customer/orders')}>
                                View Orders
                            </Button>
                        ]}
                    />
                );

            case 'pending':
            default:
                return (
                    <Result
                        status="info"
                        icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                        title="Payment Pending"
                        subTitle="Your payment is being processed. This may take a few moments."
                        extra={[
                            <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
                                Refresh Status
                            </Button>,
                            <Button key="orders" onClick={() => navigate('/customer/orders')}>
                                View Orders
                            </Button>
                        ]}
                    />
                );
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
            <Card>
                {error && !paymentStatus && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                {renderPaymentResult()}

                {order && (
                    <div style={{ marginTop: 32 }}>
                        <Descriptions title="Transaction Details" bordered column={1} size="small" style={{ marginBottom: 24 }}>
                            {paymentDetails && (
                                <>
                                    <Descriptions.Item label="Payer Name">
                                        {paymentDetails.first_name} {paymentDetails.last_name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Payment Method">
                                        {paymentDetails.method ? paymentDetails.method.toUpperCase() : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Chapa Reference">
                                        <Text copyable>{paymentDetails.reference}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date">
                                        {new Date(paymentDetails.created_at).toLocaleString()}
                                    </Descriptions.Item>
                                </>
                            )}
                        </Descriptions>

                        <Descriptions title="Order Info" bordered column={2}>
                            <Descriptions.Item label="Order Number" span={2}>
                                {order.orderNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="Amount">
                                ETB {order.finalAmount?.toFixed(2)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                {order.paymentStatus.toUpperCase()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Order Status" span={2}>
                                {order.status.toUpperCase()}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentStatus;
