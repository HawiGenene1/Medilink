import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, DatePicker, Typography, Space } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

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
            const response = await axios.get('/api/delivery/history');
            if (response.data.success) {
                const formattedData = response.data.data.map(order => ({
                    key: order._id,
                    orderId: order.orderNumber || order._id,
                    date: dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm'),
                    pickup: order.pharmacy?.name || 'Unknown',
                    dropoff: 'Customer Location', // Could be more specific if address is available
                    amount: order.totalAmount.toFixed(2),
                    earnings: (order.serviceFee || 0).toFixed(2),
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
            title: 'Pickup Location',
            dataIndex: 'pickup',
            key: 'pickup',
            responsive: ['md'],
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
            render: status => <Tag color="green">{status.toUpperCase()}</Tag>,
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
