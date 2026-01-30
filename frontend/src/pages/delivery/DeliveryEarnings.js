import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, List, Divider, Progress, Button } from 'antd';
import { DollarOutlined, RiseOutlined, ArrowUpOutlined, CarOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const DeliveryEarnings = () => {
    const [stats, setStats] = useState({
        totalEarnings: 0,
        pendingPayout: 0,
        thisWeek: 0,
        lastWeek: 0,
        completedDeliveries: 0
    });

    const [recentPayouts, setRecentPayouts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/delivery/earnings');
            if (response.data.success) {
                const data = response.data.data;
                setStats({
                    totalEarnings: data.totalEarnings,
                    pendingPayout: 0, // Backend doesn't calculate this yet, defaulting
                    thisWeek: data.todayEarnings, // Using today as proxy for now, needing backend update for full week
                    lastWeek: 0,
                    completedDeliveries: data.totalDeliveries
                });
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}><DollarOutlined /> Earnings</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '32px' }}>
                Track your delivery earnings and payouts.
            </Text>

            <Row gutter={[24, 24]}>
                {/* Summary Cards */}
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                        <Statistic
                            title="Total Earnings"
                            value={stats.totalEarnings}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix="ETB"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px' }}>
                        <Statistic
                            title="Pending Payout"
                            value={stats.pendingPayout}
                            precision={2}
                            valueStyle={{ color: '#faad14' }}
                            prefix="ETB"
                        />
                        <Button type="link" size="small" style={{ paddingLeft: 0 }}>Request Payout</Button>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px' }}>
                        <Statistic
                            title="This Week"
                            value={stats.thisWeek}
                            precision={2}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<ArrowUpOutlined />}
                            suffix="ETB"
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            +18% vs last week
                        </Text>
                    </Card>
                </Col>

                {/* Main Content Area */}
                <Col xs={24} lg={16}>
                    <Card title="Earnings Overview" style={{ borderRadius: '12px', minHeight: '400px' }}>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: '8px', marginBottom: '24px' }}>
                            <Text type="secondary">Chart Placeholder (Earnings per Day)</Text>
                        </div>

                        <Divider orientation="left">Recent Activity</Divider>
                        <List
                            itemLayout="horizontal"
                            dataSource={[]} // Placeholder until we have a recent earnings endpoint
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<div style={{ background: '#e6f7ff', padding: '8px', borderRadius: '50%' }}><CarOutlined style={{ color: '#1890ff' }} /></div>}
                                        title={item.title}
                                        description={item.desc}
                                    />
                                    <div style={{ fontWeight: 600, color: '#3f8600' }}>{item.amount}</div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Sidebar Info */}
                <Col xs={24} lg={8}>
                    <Card title="Performance Goal" style={{ borderRadius: '12px', marginBottom: '24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <Progress type="circle" percent={75} format={() => 'ETB 850'} />
                            <div style={{ marginTop: '8px' }}>Weekly Goal: ETB 1,200</div>
                        </div>
                    </Card>

                    <Card title="Recent Payouts" style={{ borderRadius: '12px' }}>
                        <List
                            size="small"
                            dataSource={recentPayouts}
                            renderItem={item => (
                                <List.Item>
                                    <div>{item.date}</div>
                                    <div style={{ fontWeight: 600 }}>ETB {item.amount.toFixed(2)}</div>
                                </List.Item>
                            )}
                        />
                        <Button block style={{ marginTop: '12px' }}>View All Payouts</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DeliveryEarnings;
