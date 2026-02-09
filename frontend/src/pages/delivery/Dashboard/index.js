import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Result, List, Tag, Row, Col, Avatar, Divider, Switch, Spin, notification, Space } from 'antd';
import {
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  RightOutlined,
  CompassOutlined,
  PoweroffOutlined,
  SyncOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../../services/api';
import { useSocket } from '../../../contexts/SocketContext';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Map Controller to safely handle re-centering
const MapController = ({ center, follow }) => {
  const map = useMap();
  const lastPos = React.useRef(null);

  useEffect(() => {
    if (!center || !follow) return;

    // Only move if significantly different (e.g., > 5 meters or first time)
    const [lat, lng] = center;
    if (!lastPos.current ||
      Math.abs(lastPos.current[0] - lat) > 0.0001 ||
      Math.abs(lastPos.current[1] - lng) > 0.0001) {

      // USE setView with animate: false for MAXIMUM stability
      // This eliminates transition-end events that cause the _leaflet_pos crash
      map.setView(center, map.getZoom(), { animate: false });
      lastPos.current = center;
    }
  }, [center, follow, map]);

  return null;
};

const { Title, Text } = Typography;

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapInitialCenter, setMapInitialCenter] = useState(null);
  const [followMe, setFollowMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]); // Active assignments
  const [incomingRequest, setIncomingRequest] = useState(null); // New requests available to accept
  const [availableJobs, setAvailableJobs] = useState([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  // Set initial map center once when first location is received
  useEffect(() => {
    if (location && !mapInitialCenter) {
      setMapInitialCenter([location.latitude, location.longitude]);
    }
  }, [location, mapInitialCenter]);

  const fetchAvailableJobs = async () => {
    if (!isOnline) return;
    setFetchingJobs(true);
    try {
      const response = await api.get('/delivery/requests/available');
      setAvailableJobs(response.data.data);
    } catch (error) {
      console.error('Fetch available jobs error:', error);
    } finally {
      setFetchingJobs(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchAvailableJobs();
    } else {
      setAvailableJobs([]);
    }
  }, [isOnline]);

  const updateStatus = async (online, loc) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { isAvailable: online };

      if (loc) {
        payload.latitude = loc.latitude;
        payload.longitude = loc.longitude;
      }

      await api.put('/delivery/status', payload);

      setIsOnline(online);
    } catch (error) {
      notification.error({ message: 'Failed to update status' });
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = () => {
    const nextState = !isOnline;

    if (nextState) {
      // Going online - show optimistic change immediately
      setIsOnline(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            setLocation(loc);
            updateStatus(true, loc);

            if (socket) {
              socket.emit('update_location', {
                userId: user?._id || user?.id,
                coordinates: loc
              });
            }
          },
          (err) => {
            console.error('Location error:', err);
            setIsOnline(false); // Revert on failure
            notification.error({ message: 'Location access required' });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        setIsOnline(false);
        notification.error({ message: 'Geolocation not supported' });
      }
    } else {
      // Going offline
      setIsOnline(false);
      updateStatus(false, null);
    }
  };

  useEffect(() => {
    if (socket && isOnline) {
      socket.on('delivery_request', (request) => {
        setIncomingRequest(request);
        notification.info({
          message: 'New Delivery Request!',
          description: `Order from ${request.pickup.name}`,
          duration: 0, // Stay until dismissed
        });
        fetchAvailableJobs(); // Refresh the list too
      });

      return () => socket.off('delivery_request');
    }
  }, [socket, isOnline]);

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const response = await api.put('/delivery/accept', { orderId });

      if (response.data.success) {
        setIncomingRequest(null);
        setTasks(prev => [response.data.data, ...prev]);
        setAvailableJobs(prev => prev.filter(job => job._id !== orderId));
        navigate(`/delivery/details/${orderId}`);
      }
    } catch (error) {
      console.error('Accept order error:', error);
      notification.error({
        message: 'Could not accept order',
        description: error.response?.data?.message || 'Something went wrong.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Poll for location updates if online
  useEffect(() => {
    let watchId;
    if (isOnline && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(loc);
          // Get the first active order ID if any
          const currentOrderId = tasks.length > 0 ? (tasks[0]._id || tasks[0].id) : null;

          socket?.emit('update_location', {
            userId: user?._id || user?.id,
            coordinates: loc,
            orderId: currentOrderId
          });
        }, (error) => { /* Error handled */ },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, socket, tasks]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Title level={2}>Delivery Portal</Title>
          <Text type="secondary">Manage your delivery assignments.</Text>
        </div>
        <Card bodyStyle={{ padding: '12px 24px' }} style={{ borderRadius: '12px', borderColor: isOnline ? '#b7eb8f' : '#ffa39e' }}>
          <Space>
            <Text strong>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              checked={isOnline}
              onChange={toggleOnline}
              loading={loading}
              checkedChildren={<PoweroffOutlined />}
              unCheckedChildren={<PoweroffOutlined />}
            />
          </Space>
        </Card>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Map View */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Current Location</span>
                {location && (
                  <Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Follow Me</Text>
                    <Switch size="small" checked={followMe} onChange={setFollowMe} />
                  </Space>
                )}
              </div>
            }
            style={{ borderRadius: '16px', overflow: 'hidden', height: '400px', marginBottom: '24px' }}
          >
            {mapInitialCenter ? (
              <MapContainer
                key="delivery-stable-map"
                center={mapInitialCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <MapController center={[location?.latitude, location?.longitude]} follow={followMe} />

                {/* High-Resolution Satellite Hybrid Layer (ESRI) */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; ESRI World Imagery"
                />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                  opacity={0.7}
                />

                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>You are here</Popup>
                </Marker>

                {/* Accuracy Circle */}
                {location.accuracy && (
                  <Circle
                    center={[location.latitude, location.longitude]}
                    radius={location.accuracy}
                    pathOptions={{ color: '#1E88E5', fillColor: '#1E88E5', fillOpacity: 0.1, weight: 1 }}
                  />
                )}

                {incomingRequest?.pickup?.location?.coordinates && (
                  <Marker position={[incomingRequest.pickup.location.coordinates[1], incomingRequest.pickup.location.coordinates[0]]}>
                    <Popup>Pickup: {incomingRequest.pickup.name}</Popup>
                  </Marker>
                )}
                {incomingRequest?.dropoff?.location?.coordinates && (
                  <Marker position={[incomingRequest.dropoff.location.coordinates[1], incomingRequest.dropoff.location.coordinates[0]]}>
                    <Popup>Dropoff: {incomingRequest.dropoff.address}</Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Text type="secondary">Go Online to view map</Text>
              </div>
            )}
          </Card>

          {incomingRequest && (
            <Card
              title={<Space><CarOutlined style={{ color: '#1890ff' }} /> New Delivery Available</Space>}
              style={{ borderRadius: '16px', border: '2px solid #1890ff', marginBottom: '24px' }}
              extra={<Tag color="gold">EARN {incomingRequest.earnings} ETB</Tag>}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Pick up from:</Text><br />
                  <Text strong>{incomingRequest.pickup.name}</Text><br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>{incomingRequest.pickup.address}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Deliver to:</Text><br />
                  <Text strong>{incomingRequest.dropoff.address}</Text>
                </Col>
              </Row>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="primary" block size="large" onClick={() => handleAcceptOrder(incomingRequest.orderId)} loading={loading}>
                  Accept Order
                </Button>
                <Button block size="large" onClick={() => setIncomingRequest(null)}>
                  Decline
                </Button>
              </div>
            </Card>
          )}

          {tasks.length === 0 && !incomingRequest && (
            <Card style={{ borderRadius: '16px', background: '#f8fafc', border: 'none', textAlign: 'center' }}>
              <Result
                status="info"
                title={isOnline ? "Waiting for orders..." : "You are offline"}
                subTitle={isOnline ? "New requests will appear here automatically." : "Go online to start receiving delivery requests."}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><InboxOutlined /> Available Jobs</Space>
                <Button
                  type="text"
                  icon={<SyncOutlined spin={fetchingJobs} />}
                  onClick={fetchAvailableJobs}
                  disabled={!isOnline}
                />
              </div>
            }
            style={{ borderRadius: '16px', minHeight: '300px', marginBottom: '24px' }}
          >
            {isOnline ? (
              <List
                dataSource={availableJobs}
                loading={fetchingJobs}
                renderItem={job => (
                  <List.Item
                    key={job._id}
                    actions={[
                      <Button type="link" onClick={() => handleAcceptOrder(job._id)}>Accept</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={job.pharmacy?.name || 'Pharmacy Order'}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text style={{ fontSize: '12px' }}>Pick: {job.pharmacy?.address?.street || 'Nearby'}</Text>
                          <Text style={{ fontSize: '12px' }}>Drop: {job.address?.label?.substring(0, 30)}...</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'No pending orders nearby' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Go Online to see jobs</Text>
              </div>
            )}
          </Card>

          <Card
            title={<Space><ClockCircleOutlined /> Active Assignments</Space>}
            style={{ borderRadius: '16px' }}
          >
            <List
              dataSource={tasks}
              locale={{ emptyText: 'No active assignments' }}
              renderItem={item => (
                <List.Item
                  key={item._id || item.id}
                  onClick={() => navigate(`/delivery/details/${item._id || item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={`Order #${item.orderNumber}`}
                    description={`Status: ${item.status}`}
                  />
                  <RightOutlined />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DeliveryDashboard;
