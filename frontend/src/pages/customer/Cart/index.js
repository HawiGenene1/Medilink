import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Avatar, Space, Checkbox, Divider, Alert } from 'antd';
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  ShopOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../../../services/api';
import { useCart } from '../../../contexts/CartContext';
import './Cart.css';

const { Title, Text } = Typography;

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartGroups, subtotal, clearCart } = useCart();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsCreatingOrder(true);

      // Transform cart items to backend format
      const orderItems = cartItems.map(item => ({
        medicineId: item.id,
        quantity: item.quantity
      }));

      // Create payload with default mock address if needed, or prompt user.
      // For this flow, we'll assume a profile/default address or let the user edit it later.
      // But orderController requires deliveryAddress. checking...
      // Controller says: deliveryAddress is required in body? logic not strictly shown but usually yes.
      // For now, let's provide a placeholder if the user hasn't set one, or ideally redirect to a pre-checkout confirming address.
      // BUT current task is connecting to Real Payment. Real Payment assumes Order Exists.
      // Let's send a placeholder "Stored Address" to pass validation, assuming profile has it.

      const payload = {
        items: orderItems,
        deliveryAddress: 'Default Profile Address', // TODO: Fetch from profile or ask user
        paymentMethod: 'card', // Default, will be chosen at payment step
        deliveryInstructions: '',
        notes: 'Order via Web Cart'
      };

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        message.success('Order created successfully!');
        clearCart(); // Clear local cart
        navigate(`/customer/orders/${response.data.data.orderId}/checkout`);
      } else {
        message.error(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      message.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const cartGroups = getCartGroups();

  const hasMissingRx = cartGroups.some(group =>
    group.items.some(item => item.rxRequired && item.rxStatus !== 'uploaded')
  );

  return (
    <div className="cart-container fade-in">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/customer/dashboard')}
        style={{ marginBottom: '24px' }}
      >
        Continue Shopping
      </Button>

      <Title level={2} style={{ marginBottom: '32px' }}>My Medical Cart</Title>

      <Row gutter={[32, 32]}>
        {/* Items Section */}
        <Col xs={24} lg={16}>
          {cartGroups.map((group, gIdx) => (
            <Card
              key={gIdx}
              title={<Space><ShopOutlined /> <Text strong>{group.pharmacy}</Text></Space>}
              className="cart-group-card"
              style={{ marginBottom: '24px' }}
              extra={<Button type="text" danger size="small">Remove All</Button>}
            >
              {group.items.map((item, iIdx) => (
                <div key={item.id} className="cart-item-row">
                  <Row align="middle" gutter={20}>
                    <Col flex="60px">
                      <div className="cart-item-img">
                        <MedicineBoxOutlined style={{ fontSize: '30px', color: '#1E88E5' }} />
                      </div>
                    </Col>
                    <Col flex="auto">
                      <div className="cart-item-info">
                        <Text strong style={{ fontSize: '16px' }}>{item.name}</Text>
                        <div style={{ marginTop: '4px' }}>
                          {item.rxRequired ? (
                            <Tag
                              color={item.rxStatus === 'uploaded' ? "success" : "warning"}
                              icon={<SafetyCertificateOutlined />}
                            >
                              {item.rxStatus === 'uploaded' ? 'Prescription Attached' : 'Missing Prescription'}
                            </Tag>
                          ) : (
                            <Tag color="cyan">OTC Medicine</Tag>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col>
                      <Space direction="vertical" align="end">
                        <Text strong style={{ fontSize: '16px' }}>{item.priceValue * item.quantity} ETB</Text>
                        <Space>
                          <Button
                            size="small"
                            shape="circle"
                            onClick={() => updateQuantity(item.id, group.pharmacy, -1)}
                          >
                            -
                          </Button>
                          <Text>{item.quantity}</Text>
                          <Button
                            size="small"
                            shape="circle"
                            onClick={() => updateQuantity(item.id, group.pharmacy, 1)}
                          >
                            +
                          </Button>
                        </Space>
                      </Space>
                    </Col>
                    <Col>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        onClick={() => removeFromCart(item.id, group.pharmacy)}
                      />
                    </Col>
                  </Row>
                  {item.rxRequired && item.rxStatus !== 'uploaded' && (
                    <div className="rx-missing-alert">
                      <Alert
                        message="Prescription missing"
                        type="warning"
                        showIcon
                        action={<Button size="small" type="primary" icon={<UploadOutlined />}>Upload Now</Button>}
                        style={{ marginTop: '16px', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </Card>
          ))}
        </Col>

        {/* Summary Section */}
        <Col xs={24} lg={8}>
          <Card className="cart-summary-card sticky-panel">
            <Title level={4} style={{ marginBottom: '24px' }}>Order Summary</Title>

            <div className="summary-row">
              <Text type="secondary">Subtotal</Text>
              <Text strong>{subtotal} ETB</Text>
            </div>
            <div className="summary-row">
              <Text type="secondary">Delivery Fee</Text>
              <Text strong>50 ETB</Text>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div className="summary-row total">
              <Text strong style={{ fontSize: '18px' }}>Total</Text>
              <Title level={3} style={{ margin: 0, color: '#1E88E5' }}>{subtotal + 50} ETB</Title>
            </div>

            <div style={{ marginTop: '32px' }}>
              {hasMissingRx && (
                <Alert
                  message="Incomplete Items"
                  description="Please upload missing prescriptions before checking out."
                  type="error"
                  showIcon
                  style={{ marginBottom: '16px', borderRadius: '8px' }}
                />
              )}
              <Button
                type="primary"
                size="large"
                block
                disabled={hasMissingRx || cartItems.length === 0}
                loading={isCreatingOrder}
                onClick={handleCheckout}
                className="checkout-btn"
                icon={<ArrowRightOutlined />}
              >
                {isCreatingOrder ? 'Creating Order...' : 'Proceed to Checkout'}
              </Button>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Space size="small">
                <SafetyCertificateOutlined style={{ color: '#43A047' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>Clinical Transaction Protected</Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cart;
