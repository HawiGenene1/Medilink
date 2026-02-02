import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Typography, Empty, Space } from 'antd';
import { CarOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/config';

const { Title, Text } = Typography;

const ActiveDeliveries = () => {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchActiveDeliveries = async () => {
        setLoading(true);
        try {
            const response = await api.get('/delivery/active');
            if (response.data.success) {
                // Transform data if necessary, or use directly
                setDeliveries(response.data.data.map(order => ({
                    id: order.orderNumber || order._id,
                    dbId: order._id, // Keep actual ID for navigation
                    pickup: {
                        name: order.pharmacy?.name || 'Unknown Pharmacy',
                        address: typeof order.pharmacy?.address === 'object'
                            ? `${order.pharmacy.address.street}, ${order.pharmacy.address.city}`
                            : (order.pharmacy?.address || 'Address not available')
                    },
                    dropoff: {
                        address: order.address?.label || order.address?.street + ', ' + order.address?.city || 'Address not available'
                    },
                    status: order.status,
                    amount: order.totalAmount,
                    earnings: order.serviceFee || 0
                })));
            }
        } catch (error) {
            console.error('Failed to fetch deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveDeliveries();

        // Poll for updates every 30s
        const interval = setInterval(fetchActiveDeliveries, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'blue';
            case 'preparing': return 'purple';
            case 'ready': return 'gold';
            case 'in_transit': return 'cyan';
            case 'delivered': return 'green';
            default: return 'default';
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}>Active Deliveries</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                Manage your current ongoing deliveries.
            </Text>

            <List
                loading={loading}
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
                dataSource={deliveries}
                locale={{ emptyText: <Empty description="No active deliveries" /> }}
                renderItem={item => (
                    <List.Item>
                        <Card
                            hoverable
                            title={<Space><CarOutlined /> {item.id}</Space>}
                            extra={<Tag color={getStatusColor(item.status)}>{item.status.replace('_', ' ').toUpperCase()}</Tag>}
                            actions={[
                                <Button type="primary" onClick={() => navigate(`/delivery/details/${item.dbId}`)}>
                                    View Details <RightOutlined />
                                </Button>
                            ]}
                        >
                            <div style={{ marginBottom: '12px' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>PICKUP</Text>
                                <div style={{ fontWeight: 500 }}>{item.pickup.name}</div>
                                <div style={{ fontSize: '13px', color: '#666' }}>{item.pickup.address}</div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>DROPOFF</Text>
                                <div style={{ fontSize: '13px' }}>{item.dropoff.address}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>ORDER VALUE</Text>
                                    <div style={{ fontWeight: 600 }}>ETB {item.amount.toFixed(2)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>EARNINGS</Text>
                                    <div style={{ fontWeight: 600, color: '#52c41a' }}>ETB {item.earnings.toFixed(2)}</div>
                                </div>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default ActiveDeliveries;
