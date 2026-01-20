import React, { useState, useEffect } from 'react';
import { Card, List, Button, Badge, Spin, message, Tag, Space, Typography, Modal, Form, Input } from 'antd';
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { deliveryAPI } from '../../../services/api/delivery';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ActiveDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [statusForm] = Form.useForm();
  const [locationTracking, setLocationTracking] = useState({});

  useEffect(() => {
    fetchDeliveries();
    // Set up location tracking interval
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const response = await deliveryAPI.getMyDeliveries({ 
        status: 'assigned,picked_up,on_the_way,nearby' 
      });
      if (response.success) {
        setDeliveries(response.data.deliveries);
      }
    } catch (error) {
      message.error('Failed to fetch deliveries');
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (position) => {
    const { latitude, longitude } = position.coords;
    
    // Update location for all active deliveries
    deliveries.forEach(async (delivery) => {
      try {
        await deliveryAPI.updateLocation(delivery._id, {
          coordinates: [longitude, latitude]
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });
  };

  const handleStatusUpdate = async (values) => {
    if (!selectedDelivery) return;

    try {
      const response = await deliveryAPI.updateDeliveryStatus(selectedDelivery._id, {
        status: values.status,
        note: values.note,
        coordinates: locationTracking[selectedDelivery._id] || []
      });

      if (response.success) {
        message.success('Delivery status updated successfully');
        setStatusModalVisible(false);
        statusForm.resetFields();
        setSelectedDelivery(null);
        fetchDeliveries();
      }
    } catch (error) {
      message.error('Failed to update delivery status');
      console.error('Error updating status:', error);
    }
  };

  const openStatusModal = (delivery) => {
    setSelectedDelivery(delivery);
    setStatusModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'blue',
      picked_up: 'orange',
      on_the_way: 'purple',
      nearby: 'green',
      delivered: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      assigned: <ClockCircleOutlined />,
      picked_up: <CarOutlined />,
      on_the_way: <EnvironmentOutlined />,
      nearby: <EnvironmentOutlined />,
      delivered: <CheckCircleOutlined />,
      cancelled: <ExclamationCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getNextStatuses = (currentStatus) => {
    const transitions = {
      assigned: ['picked_up', 'cancelled'],
      picked_up: ['on_the_way', 'cancelled'],
      on_the_way: ['nearby', 'cancelled'],
      nearby: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    return transitions[currentStatus] || [];
  };

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          message.warning('Location permission is denied. Please enable it in your browser settings.');
        } else {
          message.success('Location tracking is enabled');
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    } else {
      message.error('Geolocation is not supported by your browser');
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading deliveries...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Active Deliveries</Title>
        <Button type="primary" onClick={fetchDeliveries}>Refresh</Button>
      </div>

      {deliveries.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">No active deliveries</Text>
          </div>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={deliveries}
          renderItem={(delivery) => (
            <List.Item>
              <Card
                size="small"
                title={
                  <Space>
                    <Tag color={getStatusColor(delivery.status)} icon={getStatusIcon(delivery.status)}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </Tag>
                    <Text strong>#{delivery.order?.orderNumber}</Text>
                  </Space>
                }
                extra={
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => openStatusModal(delivery)}
                    disabled={getNextStatuses(delivery.status).length === 0}
                  >
                    Update Status
                  </Button>
                }
                actions={[
                  <div key="customer">
                    <UserOutlined /> {delivery.customer?.firstName} {delivery.customer?.lastName}
                  </div>,
                  <div key="phone">
                    <PhoneOutlined /> {delivery.customer?.phone}
                  </div>,
                  <div key="address">
                    <EnvironmentOutlined /> {delivery.deliveryAddress?.street}
                  </div>
                ]}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Pharmacy: </Text>
                  <Text>{delivery.pharmacy?.name}</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Delivery Address: </Text>
                  <Text type="secondary">
                    {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}
                  </Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Estimated Delivery: </Text>
                  <Text>
                    {delivery.estimatedDeliveryTime 
                      ? new Date(delivery.estimatedDeliveryTime).toLocaleString()
                      : 'Not set'
                    }
                  </Text>
                </div>
                {delivery.distance && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Distance: </Text>
                    <Text>{delivery.distance.remaining.toFixed(1)} km remaining</Text>
                  </div>
                )}
                {delivery.deliveryNotes && delivery.deliveryNotes.length > 0 && (
                  <div>
                    <Text strong>Latest Note: </Text>
                    <Text type="secondary">
                      {delivery.deliveryNotes[delivery.deliveryNotes.length - 1].note}
                    </Text>
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Update Delivery Status"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedDelivery(null);
          statusForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <select 
              className="ant-select-selector" 
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
            >
              <option value="">Select status</option>
              {selectedDelivery && getNextStatuses(selectedDelivery.status).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Note (optional)"
          >
            <TextArea 
              rows={3} 
              placeholder="Add any notes about this status update..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Status
              </Button>
              <Button onClick={() => setStatusModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActiveDeliveries;
