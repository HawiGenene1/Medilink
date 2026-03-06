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
  ArrowRightOutlined,
  InboxOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message, Modal, Upload, Input, Spin } from 'antd';
import { getPrescriptions, uploadPrescription } from '../../../services/api/prescriptions';
import api from '../../../services/api';
import { useCart } from '../../../contexts/CartContext';
import './Cart.css';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartGroups, subtotal, clearCart, setCartItems } = useCart();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Rx Modal State
  const [isRxModalVisible, setIsRxModalVisible] = useState(false);
  const [activeItemForRx, setActiveItemForRx] = useState(null);
  const [userPrescriptions, setUserPrescriptions] = useState([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploadingRx, setUploadingRx] = useState(false);
  const [rxNotes, setRxNotes] = useState('');
  
  const fetchUserPrescriptions = async () => {
    setLoadingRx(true);
    try {
      const response = await getPrescriptions({ status: 'approved' });
      if (response.success) {
        setUserPrescriptions(response.data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoadingRx(false);
    }
  };

  const handleOpenRxModal = (item, pharmacyId) => {
    setActiveItemForRx({ item, pharmacyId });
    setIsRxModalVisible(true);
    fetchUserPrescriptions();
  };

  const attachPrescriptionToItem = (rxId, rxUrl) => {
    // This updates the local storage immediately since we don't have updateCartItem exported yet
    const updatedCart = cartItems.map(cartItem => {
      if (cartItem.id === activeItemForRx.item.id && cartItem.pharmacyId === activeItemForRx.pharmacyId) {
        return {
          ...cartItem,
          prescriptionId: rxId,
          prescriptionImage: rxUrl,
          rxStatus: 'uploaded'
        };
      }
      return cartItem;
    });
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.location.reload(); // Simple refresh to apply cart changes
  };

  const handleUploadRx = async () => {
    if (fileList.length === 0) return;
    setUploadingRx(true);
    const formData = new FormData();
    formData.append('prescription', fileList[0]);
    formData.append('notes', rxNotes);

    try {
      const response = await uploadPrescription(formData);
      if (response.success) {
        message.success('Prescription uploaded successfully!');
        attachPrescriptionToItem(response.data.prescriptionId, response.data.imageUrl);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error uploading prescription.');
    } finally {
      setUploadingRx(false);
    }
  };

  const handleCheckout = async (group) => {
    try {
      setIsCreatingOrder(true);

      const orderItems = group.items.map(item => ({
        medicine: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.priceValue,
        prescriptionId: item.prescriptionId || null
      }));

      // Find first prescription ID in the groiup to attach to order level
      const groupPrescriptionId = group.items.find(i => i.prescriptionRequired && i.prescriptionId)?.prescriptionId;

      const payload = {
        pharmacyId: group.pharmacyId,
        items: orderItems,
        totalAmount: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        address: {
          label: 'Default Profile Address', // Fallback
          geojson: { type: 'Point', coordinates: [38.7492, 9.0113] } // Dummy but required
        },
        paymentMethod: 'card',
        notes: 'Order via Web Cart',
        prescriptionId: groupPrescriptionId // Attach main prescription ID to the order
      };

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        message.success('Order created successfully!');
        // Remove only this pharmacy's items from cart
        group.items.forEach(item => removeFromCart(item.id, group.pharmacyId));
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
    group.items.some(item => (item.prescriptionRequired || item.requiresPrescription) && !item.prescriptionId)
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
              title={<Space><ShopOutlined /> <Text strong>{typeof group.pharmacyName === 'object' ? group.pharmacyName?.name : (group.pharmacyName || 'Pharmacy')}</Text></Space>}
              className="cart-group-card"
              style={{ marginBottom: '24px' }}
              extra={
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleCheckout(group)}
                    loading={isCreatingOrder}
                  >
                    Checkout This Pharmacy
                  </Button>
                  <Button type="text" danger size="small">Remove All</Button>
                </Space>
              }
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
                          {(item.prescriptionRequired || item.requiresPrescription) ? (
                            <Tag
                              color={item.prescriptionId ? "success" : "warning"}
                              icon={<SafetyCertificateOutlined />}
                            >
                              {item.prescriptionId ? 'Prescription Attached' : 'Missing Prescription'}
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
                            onClick={() => updateQuantity(item.id, group.pharmacyId, -1)}
                          >
                            -
                          </Button>
                          <Text>{item.quantity}</Text>
                          <Button
                            size="small"
                            shape="circle"
                            onClick={() => updateQuantity(item.id, group.pharmacyId, 1)}
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
                        onClick={() => removeFromCart(item.id, group.pharmacyId)}
                      />
                    </Col>
                  </Row>
                  {(item.prescriptionRequired || item.requiresPrescription) && !item.prescriptionId && (
                    <div className="rx-missing-alert">
                      <Alert
                        message="Prescription missing"
                        type="warning"
                        showIcon
                        action={
                          <Button size="small" type="primary" icon={<UploadOutlined />} onClick={() => handleOpenRxModal(item, group.pharmacyId)}>
                            Upload Now
                          </Button>
                        }
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
                onClick={() => handleCheckout(cartGroups[0])} // Default checkout first group
                className="checkout-btn"
                icon={<ArrowRightOutlined />}
              >
                {isCreatingOrder ? 'Creating Order...' : 'Checkout All (First Pharmacy)'}
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

      <Modal
        title="Upload or Select Prescription"
        open={isRxModalVisible}
        onCancel={() => setIsRxModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Attach Prescription for: </Text>
          <Text type="secondary">{activeItemForRx?.item?.name}</Text>
        </div>
        
        <Title level={5} style={{ marginTop: '20px' }}>Select Existing Approved Prescription</Title>
        <List
          loading={loadingRx}
          dataSource={userPrescriptions}
          renderItem={rx => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  onClick={() => {
                    attachPrescriptionToItem(rx._id, rx.imageUrl);
                    setIsRxModalVisible(false);
                    message.success('Prescription selected successfully!');
                  }}
                >
                  Select
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileProtectOutlined />} style={{ background: '#E3F2FD', color: '#1E88E5' }} />}
                title={rx.originalName}
                description={`Uploaded on ${new Date(rx.uploadedAt).toLocaleDateString()}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: <div style={{ padding: '20px', textAlign: 'center' }}><Text type="secondary">No approved prescriptions found.</Text></div> }}
          style={{ marginBottom: '32px' }}
        />

        <Divider>OR</Divider>

        <Title level={5}>Upload New Prescription</Title>
        <div style={{ padding: '10px 0' }}>
          <Dragger
            multiple={false}
            fileList={fileList}
            beforeUpload={file => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1E88E5' }} /></p>
            <p className="ant-upload-text">Click or drag prescription image to this area</p>
          </Dragger>
          
          <Input.TextArea
            rows={3}
            placeholder="Additional notes for the pharmacist..."
            style={{ marginTop: '16px', borderRadius: '8px' }}
            value={rxNotes}
            onChange={e => setRxNotes(e.target.value)}
          />
          
          <Button
            type="primary"
            block
            size="large"
            style={{ marginTop: '20px' }}
            onClick={handleUploadRx}
            loading={uploadingRx}
            disabled={fileList.length === 0}
          >
            Upload and Attach
          </Button>
        </div>
      </Modal>    
    </div>
  );
};

export default Cart;
