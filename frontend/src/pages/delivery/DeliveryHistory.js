import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, DatePicker, Typography, Space } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DeliveryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get('/delivery/history');
            if (response.data.success) {
                const formattedData = response.data.data.map(order => ({
                    key: order._id,
                    orderId: order.orderNumber || order._id,
                    date: dayjs(order.actualArrivalTime || order.updatedAt).format('YYYY-MM-DD HH:mm'),
                    pickup: typeof order.pharmacy === 'object' ? (order.pharmacy?.name || 'Pharmacy') : (order.pharmacy || 'Pharmacy'),
                    dropoff: typeof order.address === 'object' ? (order.address?.street || order.address?.label || 'Customer') : 'Customer',
                    amount: order.finalAmount || order.totalAmount,
                    earnings: order.courierEarnings || order.serviceFee || 0,
                    status: order.status
                }));
                setHistory(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: text => <Text strong>{text}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Pickup',
            dataIndex: 'pickup',
            key: 'pickup',
            responsive: ['md'],
        },
        {
            title: 'Dropoff',
            dataIndex: 'dropoff',
            key: 'dropoff',
            responsive: ['lg'],
        },
        {
            title: 'Order Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: text => `ETB ${text}`,
            responsive: ['sm'],
        },
        {
            title: 'Earnings',
            dataIndex: 'earnings',
            key: 'earnings',
            render: text => <Text type="success" strong>ETB {text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = 'blue';
                if (status === 'delivered') color = 'green';
                if (status === 'cancelled') color = 'red';
                if (status === 'refunded') color = 'orange';
                return <Tag color={color}>{status.toUpperCase().replace('_', ' ')}</Tag>;
            },
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2}><HistoryOutlined /> Delivery History</Title>
                    <Text type="secondary">View your past completed deliveries.</Text>
                </div>
                <Space>
                    <RangePicker />
                </Space>
            </div>

            <Card style={{ borderRadius: '12px', overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={history}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 600 }}
                />
            </Card>
        </div>
    );
};

export default DeliveryHistory;
