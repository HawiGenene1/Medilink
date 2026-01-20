import React, { useState } from 'react';
import { Card, Button, Space, Divider, Typography, message } from 'antd';
import { Printer, Download, MailOutlined, EyeOutlined } from '@ant-design/icons';
import PaymentReceipt from '../components/payment/PaymentReceipt';
import ReceiptService from '../services/receiptService';

const { Title, Text } = Typography;

const ReceiptDemo = () => {
  // Sample payment data
  const samplePaymentData = {
    transactionId: 'TXN-2024-001',
    paymentMethod: 'telebirr',
    status: 'Paid',
    amount: 102500,
    charge: 2500,
    createdAt: new Date(),
    chapaReference: 'PLSI6wja6GSh',
    bankReference: 'CGO3PAXUSH'
  };

  // Sample order data
  const sampleOrderData = {
    orderNumber: 'ORD-2024-001',
    items: [
      {
        name: 'Paracetamol',
        price: 50000,
        quantity: 2
      },
      {
        name: 'Vitamin C',
        price: 2500,
        quantity: 1
      }
    ]
  };

  // Sample user data
  const sampleUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+251912345678'
  };

  // Generate receipt data
  const receiptData = ReceiptService.generateReceiptData(
    samplePaymentData,
    sampleOrderData,
    sampleUserData
  );

  const [showReceipt, setShowReceipt] = useState(false);

  const handlePrint = () => {
    ReceiptService.printReceipt(receiptData);
    message.success('Receipt sent to printer!');
  };

  const handleDownload = () => {
    ReceiptService.downloadReceipt(receiptData);
    message.success('Receipt downloaded successfully!');
  };

  const handleEmail = async () => {
    try {
      await ReceiptService.emailReceipt(receiptData, sampleUserData.email);
      message.success('Receipt emailed successfully!');
    } catch (error) {
      message.error('Failed to email receipt. Please try again.');
    }
  };

  const handleViewReceipt = () => {
    setShowReceipt(true);
  };

  if (showReceipt) {
    return (
      <div>
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Button 
            onClick={() => setShowReceipt(false)}
            style={{ marginBottom: 20 }}
          >
            ← Back to Demo
          </Button>
        </div>
        <PaymentReceipt 
          receiptData={receiptData}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onEmail={handleEmail}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Payment Receipt Demo</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Sample Data Display */}
        <Card title="Sample Payment Information" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Order Number:</Text> {sampleOrderData.orderNumber}
            </div>
            <div>
              <Text strong>Transaction ID:</Text> {samplePaymentData.transactionId}
            </div>
            <div>
              <Text strong>Payment Method:</Text> {ReceiptService.getPaymentMethodName(samplePaymentData.paymentMethod)}
            </div>
            <div>
              <Text strong>Amount:</Text> {receiptData.total} ETB
            </div>
            <div>
              <Text strong>Status:</Text> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{samplePaymentData.status}</span>
            </div>
            <div>
              <Text strong>Customer:</Text> {sampleUserData.firstName} {sampleUserData.lastName}
            </div>
            <div>
              <Text strong>Email:</Text> {sampleUserData.email}
            </div>
          </Space>
        </Card>

        <Divider />

        {/* Action Buttons */}
        <Card title="Receipt Actions" size="small">
          <Space size="large">
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={handleViewReceipt}
            >
              View Receipt
            </Button>
            <Button 
              icon={<Printer />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
            <Button 
              icon={<Download />}
              onClick={handleDownload}
            >
              Download HTML
            </Button>
            <Button 
              icon={<MailOutlined />}
              onClick={handleEmail}
            >
              Email Receipt
            </Button>
          </Space>
        </Card>

        {/* Instructions */}
        <Card title="How to Use" size="small">
          <Space direction="vertical">
            <div>
              <Text strong>1. View Receipt:</Text> Click to see the full receipt layout
            </div>
            <div>
              <Text strong>2. Print:</Text> Opens print dialog for physical receipt
            </div>
            <div>
              <Text strong>3. Download:</Text> Saves receipt as HTML file
            </div>
            <div>
              <Text strong>4. Email:</Text> Sends receipt to customer email (requires backend setup)
            </div>
          </Space>
        </Card>

        {/* Integration Example */}
        <Card title="Code Integration Example" size="small">
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
{`import PaymentReceipt from './components/payment/PaymentReceipt';
import ReceiptService from './services/receiptService';

// Generate receipt data
const receiptData = ReceiptService.generateReceiptData(
  paymentData,    // Payment information
  orderData,      // Order details
  userData        // Customer information
);

// Use in component
<PaymentReceipt 
  receiptData={receiptData}
  onPrint={() => ReceiptService.printReceipt(receiptData)}
  onDownload={() => ReceiptService.downloadReceipt(receiptData)}
  onEmail={() => ReceiptService.emailReceipt(receiptData, email)}
/>`}
          </pre>
        </Card>
      </Space>
    </div>
  );
};

export default ReceiptDemo;
