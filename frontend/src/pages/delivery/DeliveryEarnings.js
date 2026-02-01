import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, List, Divider, Progress, Button, App, Modal, Form, InputNumber, Space, Tag, Empty } from 'antd';
import { DollarOutlined, RiseOutlined, ArrowUpOutlined, CarOutlined, TrophyOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const DeliveryEarnings = () => {
    const { message } = App.useApp();
    const [stats, setStats] = useState({
        totalEarnings: 0,
        pendingPayout: 0,
        thisWeek: 0,
        today: 0,
        completedDeliveries: 0,
        dailyEarnings: [],
        weeklyGoal: 1000
    });

    const [loading, setLoading] = useState(false);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [goalForm] = Form.useForm();

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/delivery/earnings');
            if (response.data.success) {
                const data = response.data.data;

                // Process chart data to ensure last 7 days are represented
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const found = data.dailyEarnings?.find(de => de._id === dateStr);
                    last7Days.push({
                        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        amount: found ? found.amount : 0,
                        date: dateStr
                    });
                }

                setStats({
                    totalEarnings: data.totalEarnings || 0,
                    pendingPayout: data.pendingPayout || 0,
                    thisWeek: data.thisWeekEarnings || 0,
                    today: data.todayEarnings || 0,
                    completedDeliveries: data.completedDeliveries || 0,
                    dailyEarnings: last7Days,
                    recentTransactions: data.recentTransactions || [],
                    weeklyGoal: data.weeklyGoal || 1000
                });
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
            message.error('Could not load earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    const handleRequestPayout = async () => {
        if (stats.pendingPayout <= 0) {
            message.warning('No pending earnings to payout');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/delivery/payout/request');
            if (response.data.success) {
                message.success('Payout requested successfully!');
                await fetchEarnings(); // Refresh data immediately
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Payout request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetGoal = async (values) => {
        setLoading(true);
        try {
            const response = await api.put('/delivery/profile', { weeklyGoal: values.goal });
            if (response.data.success) {
                message.success('Weekly goal updated!');
                setIsGoalModalVisible(false);
                await fetchEarnings();
            }
        } catch (error) {
            message.error('Failed to update goal');
        } finally {
            setLoading(false);
        }
    };

    const RecommendedBox = ({ title, children, icon, action }) => (
        <Card
            className="recommended-feature-card"
            style={{
                borderRadius: '16px',
                border: '1px solid #e6f7ff',
                background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                marginBottom: '24px'
            }}
            title={
                <Space>
                    <div style={{
                        background: '#1E88E5',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        {icon}
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{title}</span>
                    <Tag color="blue" style={{ marginLeft: '8px', borderRadius: '4px', fontSize: '10px' }}>RECOMMENDED</Tag>
                </Space>
            }
            extra={action}
        >
            {children}
        </Card>
    );

    const goalPercent = Math.min(Math.round((stats.thisWeek / stats.weeklyGoal) * 100), 100);

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
            <div style={{ marginBottom: '32px' }}>
                <Title level={2}>Earnings & Performance</Title>
                <Text type="secondary">Monitor your growth and manage your digital wallet.</Text>
            </div>

            <Row gutter={[24, 24]}>
                {/* Statistics Row */}
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Lifetime Earnings</Text>}
                            value={stats.totalEarnings}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix={<Text style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '4px' }}>ETB</Text>}
                            valueStyle={{ color: '#1E88E5', fontWeight: 700 }}
                        />
                        <div style={{ marginTop: '12px' }}>
                            <Tag color="success" icon={<ArrowUpOutlined />}>Verified Partner</Tag>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fffbe6' }}>
                        <Statistic
                            title={<Text type="secondary">Available for Payout</Text>}
                            value={stats.pendingPayout}
                            precision={2}
                            valueStyle={{ color: '#faad14', fontWeight: 700 }}
                            suffix={<Text style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '4px' }}>ETB</Text>}
                        />
                        <Button
                            type="primary"
                            block
                            style={{ marginTop: '16px', borderRadius: '8px', height: '36px', background: '#faad14', border: 'none' }}
                            onClick={handleRequestPayout}
                            loading={loading}
                            disabled={stats.pendingPayout < 50}
                        >
                            {stats.pendingPayout < 50 ? `Min ETB 50 needed` : 'Request Instant Payout'}
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title={<Text type="secondary">Earned This Week</Text>}
                            value={stats.thisWeek}
                            precision={2}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                            suffix={<Text style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '4px' }}>ETB</Text>}
                        />
                        <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                            {stats.completedDeliveries} deliveries completed
                        </Paragraph>
                    </Card>
                </Col>

                {/* Main Content Area */}
                <Col xs={24} lg={16}>
                    <Card title="Earnings Overview" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyEarnings}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f5f5f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        {stats.dailyEarnings.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 6 ? '#1E88E5' : '#bae7ff'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Daily earnings for the last 7 days</Text>
                        </div>
                    </Card>

                    <div style={{ marginTop: '24px' }}>
                        <RecommendedBox
                            title="Recent Transactions"
                            icon={<HistoryOutlined />}
                            action={<Button type="link" onClick={fetchEarnings} loading={loading}>Refresh</Button>}
                        >
                            <List
                                itemLayout="horizontal"
                                dataSource={stats.recentTransactions}
                                locale={{ emptyText: <Empty description="No recent transactions" /> }}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<div style={{ background: '#e6f7ff', padding: '10px', borderRadius: '12px' }}><CarOutlined style={{ color: '#1E88E5' }} /></div>}
                                            title={<Text strong>Order Completed</Text>}
                                            description={new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        />
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: '#52c41a', fontSize: '16px' }}>+ ETB {item.amount.toFixed(2)}</div>
                                            <Tag color={item.status === 'Paid' ? 'blue' : 'orange'} style={{ borderRadius: '4px', fontSize: '10px', marginTop: '4px' }}>
                                                {item.status.toUpperCase()}
                                            </Tag>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </RecommendedBox>
                    </div>
                </Col>

                {/* Sidebar */}
                <Col xs={24} lg={8}>
                    <Card
                        title={<Space><TrophyOutlined style={{ color: '#faad14' }} /> Performance Goal</Space>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}
                        extra={<Button type="link" icon={<SettingOutlined />} onClick={() => setIsGoalModalVisible(true)} />}
                    >
                        <div style={{ padding: '20px 0' }}>
                            <Progress
                                type="circle"
                                percent={goalPercent}
                                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                format={() => (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <Text strong style={{ fontSize: '20px' }}>{goalPercent}%</Text>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>Reached</Text>
                                    </div>
                                )}
                                strokeWidth={8}
                                width={160}
                            />
                            <div style={{ marginTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <Text type="secondary">Current Weekly</Text>
                                    <Text strong>ETB {stats.thisWeek.toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Weekly Goal</Text>
                                    <Text strong style={{ color: '#1E88E5' }}>ETB {stats.weeklyGoal.toFixed(2)}</Text>
                                </div>
                                <Divider style={{ margin: '16px 0' }} />
                                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                                    {goalPercent >= 100 ? "Congratulations! You've hit your goal! 🚀" : `You need ETB ${Math.max(0, stats.weeklyGoal - stats.thisWeek).toFixed(2)} more to hit your goal.`}
                                </Paragraph>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="Pro Tips"
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '24px', background: '#f9f9f9' }}
                    >
                        <List
                            size="small"
                            dataSource={[
                                'Peak hours (6 PM - 9 PM) offer 20% higher earnings.',
                                'Completing 5 orders in a row boosts your priority.',
                                'Better ratings lead to more premium delivery requests.'
                            ]}
                            renderItem={item => <List.Item style={{ border: 'none', padding: '8px 0' }}><Text style={{ fontSize: '13px' }}>• {item}</Text></List.Item>}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Set Goal Modal */}
            <Modal
                title="Update Weekly Performance Goal"
                open={isGoalModalVisible}
                onCancel={() => setIsGoalModalVisible(false)}
                onOk={() => goalForm.submit()}
                confirmLoading={loading}
                centered
                destroyOnClose
            >
                <Paragraph type="secondary">
                    Setting a visual goal helps you track your progress and stay motivated.
                </Paragraph>
                <Form form={goalForm} layout="vertical" onFinish={handleSetGoal} initialValues={{ goal: stats.weeklyGoal }}>
                    <Form.Item
                        name="goal"
                        label="Weekly Earnings Goal (ETB)"
                        rules={[{ required: true, message: 'Please set a goal' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={100}
                            step={100}
                            formatter={value => `ETB ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/ETB\s?|(,*)/g, '')}
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DeliveryEarnings;
