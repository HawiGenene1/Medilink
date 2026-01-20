import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, 
    Typography, 
    Button, 
    Row, 
    Col, 
    Divider, 
    Tag, 
    Spin, 
    Alert, 
    Descriptions,
    Space,
    Table
} from 'antd';
import { 
    ArrowLeftOutlined, 
    DownloadOutlined, 
    PrinterOutlined, 
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import './InvoicePage.css';

const { Title, Text } = Typography;

const InvoicePage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoice();
    }, [orderId]);

    const fetchInvoice = async () => {
        try {
            const response = await api.get(`/invoices/order/${orderId}`);
            if (response.data.success) {
                setInvoice(response.data.data);
            } else {
                setError('Invoice not found');
            }
        } catch (err) {
            console.error('Error fetching invoice:', err);
            setError('Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;

    if (error) return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <Alert message="Error" description={error} type="error" showIcon
                action={<Button onClick={() => navigate(-1)}>Go Back</Button>} />
        </div>
    );

    if (!invoice) return null;

    const columns = [
        { title: 'Item', dataIndex: 'name', key: 'name' },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Unit Price', dataIndex: 'price', key: 'price', render: p => `${p.toFixed(2)} ETB`, align: 'right' },
        { title: 'Total', dataIndex: 'total', key: 'total', render: t => `${t.toFixed(2)} ETB`, align: 'right' }
    ];

    return (
        <div className="invoice-container">
            <div className="no-print" style={{ marginBottom: 20, maxWidth: '210mm', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
                <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Invoice</Button>
            </div>

            <div className="invoice-paper">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1E88E5' }}>MEDILINK</Title>
                        <Text type="secondary">Excellence in Healthcare Delivery</Text>
                        <div style={{ marginTop: 10 }}>
                            <Text>{invoice.pharmacyAddress}</Text>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Title level={3} style={{ margin: 0 }}>INVOICE</Title>
                        <Text strong style={{ display: 'block', marginTop: 5 }}>#{invoice.invoiceNumber}</Text>
                        <Text type="secondary">Date: {new Date(invoice.issueDate).toLocaleDateString()}</Text>
                        <div style={{ marginTop: 10 }}>
                            <Tag color="green" style={{ fontSize: 14, padding: '4px 10px' }}>PAID</Tag>
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <Row gutter={40} style={{ marginBottom: 40 }}>
                    <Col span={12}>
                        <Text type="secondary">Bill To:</Text>
                        <div style={{ marginTop: 5 }}>
                            <Text strong style={{ fontSize: 16 }}>{invoice.customer.firstName} {invoice.customer.lastName}</Text>
                            <div style={{ display: 'block' }}>{invoice.customer.email}</div>
                            <div style={{ display: 'block' }}>{invoice.customer.phone}</div>
                        </div>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Text type="secondary">Order Reference:</Text>
                        <div style={{ marginTop: 5 }}>
                            <Text strong>{invoice.order.orderNumber}</Text>
                        </div>
                    </Col>
                </Row>

                {/* Items */}
                <Table
                    columns={columns}
                    dataSource={invoice.items}
                    pagination={false}
                    rowKey="name"
                    bordered={false}
                    className="invoice-table"
                />

                {/* Totals */}
                <Row style={{ marginTop: 20 }}>
                    <Col span={12}></Col>
                    <Col span={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <Text>Subtotal:</Text>
                            <Text>{invoice.subtotal.toFixed(2)} ETB</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <Text>Tax (0%):</Text>
                            <Text>{invoice.tax.toFixed(2)} ETB</Text>
                        </div>
                        <Divider style={{ margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <Title level={4}>Total:</Title>
                            <Title level={4}>{invoice.totalAmount.toFixed(2)} ETB</Title>
                        </div>
                    </Col>
                </Row>

                {/* Footer */}
                <div style={{ marginTop: 50, textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                    <Text type="secondary">Thank you for choosing Medilink!</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>This is a computer-generated invoice.</Text>
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
