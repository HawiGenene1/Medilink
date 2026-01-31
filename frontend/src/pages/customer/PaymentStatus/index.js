import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { Result, Button, Spin, Card, Typography, Descriptions, Tag, Alert } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCart } from '../../../contexts/CartContext';
import './PaymentStatus.css';

const { Title, Text, Paragraph } = Typography;

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    // Status state
    const [loading, setLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);

    // Transaction Logs State
    const [viewLogs, setViewLogs] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Get params from URL
    const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!txRef) {
                setError('No transaction reference found');
                setLoading(false);
                return;
            }

            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response = await axios.get(`${apiUrl}/payments/chapa/verify/${txRef}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.data.success) {
                    setVerificationResult(response.data);
                    clearCart();
                } else {
                    setError(response.data.message || 'Payment verification failed');
                }
            } catch (err) {
                console.error('Verification error:', err);
                setError(err.response?.data?.message || 'Failed to verify payment with server');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [txRef, clearCart]);

    if (loading) {
        return (
            <div className="fullscreen-center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#82c91e' }} spin />} />
                <Title level={4} style={{ marginTop: 24, color: '#333' }}>Verifying Payment...</Title>
            </div>
        );
    }

    if (error || (verificationResult && verificationResult.status !== 'success' && verificationResult.data?.status !== 'success')) {
        return (
            <div className="payment-status-container">
                <Result
                    status="error"
                    title="Payment Failed"
                    subTitle={error || "Your transaction could not be completed."}
                    extra={[
                        <Button type="primary" key="retry" onClick={() => navigate('/customer/cart')}>
                            Return to Cart
                        </Button>
                    ]}
                />
            </div>
        );
    }

    const data = verificationResult?.data || {};
    const amount = parseFloat(data.amount || 0);
    const charge = parseFloat(data.charge || 0);
    const total = amount + charge;
    const date = new Date(data.created_at || Date.now()).toLocaleDateString('en-GB');

    return (
        <div className="payment-status-container">
            <div className="chapa-receipt">
                {/* Header */}
                <div className="receipt-header">
                    <div className="logo-area">
                        <span style={{ color: '#82c91e', fontSize: '28px' }}>Medi</span>Link Pharmacy
                    </div>
                    <div className="receipt-title">RECEIPT</div>
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <div className="info-column">
                        <h3>Receipt From</h3>
                        <h4>MediLink Pharmacy</h4>
                        <div className="info-row"><span className="info-label">TIN</span><span className="info-value">0012345678</span></div>
                        <div className="info-row"><span className="info-label">Phone No.</span><span className="info-value">+251-911-223344</span></div>
                        <div className="info-row"><span className="info-label">Address</span><span className="info-value">Bole, Addis Ababa</span></div>
                    </div>

                    <div className="info-column" style={{ textAlign: 'right' }}>
                        <h3>Merchant Info</h3>
                        <div className="info-row" style={{ justifyContent: 'flex-end' }}><span className="info-label">Date</span><span className="info-value">{date}</span></div>
                        <div className="info-row" style={{ justifyContent: 'flex-end' }}><span className="info-label">Order ID</span><span className="info-value">{orderId}</span></div>
                    </div>
                </div>

                {/* Details Header */}
                <div className="details-section">
                    <div className="details-header-row">
                        <div className="green-bar">PAYMENT DETAILS</div>
                        <div className="dark-bar">{data.tx_ref || txRef}</div>
                    </div>

                    {/* Details Table */}
                    <div className="details-table">
                        <div className="detail-row">
                            <div className="detail-label">Payer Name <span className="amharic">የከፋይ ስም</span></div>
                            <div className="detail-value">{data.first_name} {data.last_name}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Phone Number <span className="amharic">ስልክ ቁጥር</span></div>
                            <div className="detail-value">{data.phone_number || data.mobile || 'N/A'}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Email Address <span className="amharic">ኢሜይል አድራሻ</span></div>
                            <div className="detail-value">{data.email}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Payment Method <span className="amharic">የክፍያ መንገድ</span></div>
                            <div className="detail-value" style={{ textTransform: 'uppercase' }}>{data.method || 'Unknown'}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Status <span className="amharic">ሁኔታ</span></div>
                            <div className="detail-value paid">Paid / ተከፍሏል</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Payment Reason <span className="amharic">የክፍያ ምክንያት</span></div>
                            <div className="detail-value">Medical Supplies Order</div>
                        </div>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="footer-section">
                    <div className="stamp">
                        <div style={{ fontSize: '24px' }}>✓</div>
                        <div>PAID</div>
                        <div>MediLink</div>
                    </div>

                    <div className="totals-table">
                        <div className="total-row">
                            <span>Sub Total</span>
                            <span>{amount.toFixed(2)} ETB</span>
                        </div>
                        <div className="total-row">
                            <span>Charge (0%)</span>
                            <span>{charge.toFixed(2)} ETB</span>
                        </div>
                        <div className="total-row final">
                            <span>Total</span>
                            <span>{total.toFixed(2)} ETB</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="action-bar">
                    <div className="contact-info">
                        <div className="contact-item cursor-pointer" onClick={() => navigate('/customer/home')}>
                            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Go Home</span>
                        </div>
                        <div className="contact-item cursor-pointer" onClick={() => {
                            if (!viewLogs && logs.length === 0) {
                                setLogsLoading(true);
                                setViewLogs(true);
                                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                                axios.get(`${apiUrl}/payments/chapa/events/${data.tx_ref || txRef}`, {
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                })
                                    .then(res => {
                                        setLogs(res.data.data || []);
                                        setLogsLoading(false);
                                    })
                                    .catch(err => {
                                        console.error("Failed to load logs", err);
                                        setLogsLoading(false);
                                    });
                            } else {
                                setViewLogs(!viewLogs);
                            }
                        }}>
                            {viewLogs ? 'Hide Logs' : 'View Logs'}
                        </div>
                    </div>
                    <div className="thank-you">THANK YOU FOR CHOOSING MEDILINK</div>
                </div>

                {/* Transaction Logs Section */}
                {viewLogs && (
                    <div className="logs-section" style={{ padding: '20px 40px', borderTop: '1px solid #eee' }}>
                        <Title level={5} style={{ color: '#82c91e' }}>Transaction Timeline</Title>
                        {logsLoading ? (
                            <Spin />
                        ) : (
                            <div className="timeline-list">
                                {logs.length > 0 ? (
                                    logs.map((log, index) => (
                                        <div key={index} className="timeline-item" style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #ddd' }}>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                            <div style={{ fontWeight: '600' }}>{log.message}</div>
                                            <Tag color={log.type === 'log' ? 'blue' : 'default'}>{log.type}</Tag>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary">No logs available for this transaction.</Text>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentStatus;
