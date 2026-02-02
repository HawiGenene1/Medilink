import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Table, Tag, Button, Space, Statistic, Modal, Form, Input, Select, DatePicker, message, Drawer, Timeline, List } from 'antd';
import { CrownOutlined, DollarOutlined, SolutionOutlined, UserAddOutlined, PlusOutlined, HistoryOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import pharmacyAdminService from '../../../services/pharmacyAdminService';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const SubscriptionManagement = () => {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [stats, setStats] = useState({ active: 0, monthlyRevenue: 0, expiring: 0 });
    const [assignModal, setAssignModal] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [form] = Form.useForm();

    const [plans, setPlans] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Plans (Dynamic)
            let plansResponse;
            try {
                plansResponse = await pharmacyAdminService.getSubscriptionPlans();
            } catch (err) {
                console.error('Error fetching plans:', err);
                throw new Error('Failed to load subscription plans: ' + (err.response?.data?.message || err.message));
            }

            // Process plans into array format required by UI
            const planList = Array.isArray(plansResponse) ? plansResponse : (plansResponse?.data || []);

            if (!Array.isArray(planList)) {
                console.error('Invalid plans format:', plansResponse);
                throw new Error('Invalid subscription plans format received from server');
            }

            const formattedPlans = planList.map(p => ({
                name: p.name || 'Unknown',
                price: p.label || 'N/A',
                features: p.features || [],
                id: p.id
            }));

            // Sort by price (basic -> standard -> premium) - optional, or rely on array order
            // Usually we want Basic first.
            const sortedPlans = formattedPlans.sort((a, b) => {
                if (a.id === 'basic') return -1;
                if (b.id === 'basic') return 1;
                if (a.id === 'standard') return -1;
                if (b.id === 'standard') return 1;
                return 0;
            });

            setPlans(sortedPlans);

            // Fetch subscriptions
            let subResponse;
            try {
                subResponse = await pharmacyAdminService.getAllSubscriptions();
            } catch (err) {
                console.error('Error fetching subscriptions:', err);
                throw new Error('Failed to load pharmacy subscriptions: ' + (err.response?.data?.message || err.message));
            }

            if (!subResponse || !subResponse.data || !Array.isArray(subResponse.data)) {
                console.error('Invalid subscriptions response format:', subResponse);
                throw new Error('Invalid subscriptions format received from server');
            }

            setSubscriptions(subResponse.data);

            const activeCount = subResponse.data.filter(s => s.status === 'active').length;
            const totalRevenue = subResponse.data.reduce((sum, s) => {
                // Ensure we handle both backend response formats safely
                const planList = Array.isArray(plansResponse) ? plansResponse : plansResponse.data || [];
                const planDetails = planList.find(p => p.id === s.plan);
                return sum + (planDetails ? (planDetails.price || 0) : 0);
            }, 0);

            const expiringCount = subResponse.data.filter(s => {
                const endDate = new Date(s.endDate);
                const now = new Date();
                const thirtyDaysLimit = new Date();
                thirtyDaysLimit.setDate(thirtyDaysLimit.getDate() + 30);
                return s.status === 'active' && endDate <= thirtyDaysLimit && endDate >= now;
            }).length;

            setStats({
                active: activeCount,
                monthlyRevenue: totalRevenue,
                expiring: expiringCount
            });

            // Fetch pharmacies for assignment
            let pharmResponse;
            try {
                pharmResponse = await pharmacyAdminService.getAllPharmacies({ limit: 100 });
            } catch (err) {
                console.error('Error fetching pharmacies:', err);
                throw new Error('Failed to load pharmacies: ' + (err.response?.data?.message || err.message));
            }

            if (!pharmResponse || !pharmResponse.data || !Array.isArray(pharmResponse.data)) {
                console.error('Invalid pharmacies response format:', pharmResponse);
                throw new Error('Invalid pharmacies format received from server');
            }

            setPharmacies(pharmResponse.data.filter(p => !p.subscription));
        } catch (error) {
            console.error('Detailed fetch error:', error);
            message.error(error.message || 'Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSubscription = async (values) => {
        try {
            await pharmacyAdminService.assignSubscription({
                pharmacyId: values.pharmacy,
                plan: values.plan,
                durationMonths: values.duration
            });

            message.success('Subscription assigned successfully');
            setAssignModal(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            console.error('Error assigning subscription:', error);
            message.error(error.response?.data?.message || 'Failed to assign subscription');
        }
    };

    const handleRenewSubscription = async (subscriptionId) => {
        try {
            await pharmacyAdminService.updateSubscription(subscriptionId, { durationMonths: 12 });
            message.success('Subscription renewed for 12 months');
            fetchData();
        } catch (error) {
            console.error('Error renewing subscription:', error);
            message.error('Failed to renew subscription');
        }
    };

    const handleStatusChange = async (subscriptionId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            await pharmacyAdminService.updateSubscription(subscriptionId, { status: newStatus });
            message.success(`Subscription ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update status');
        }
    };

    const handleViewHistory = async (subscriptionId) => {
        try {
            const response = await pharmacyAdminService.getSubscriptionHistory(subscriptionId);
            setHistoryData(response.data);
            setHistoryOpen(true);
        } catch (error) {
            console.error('Error fetching history:', error);
            message.error('Failed to load history');
        }
    };

    const columns = [
        {
            title: 'Pharmacy',
            dataIndex: ['pharmacy', 'name'],
            key: 'pharmacy',
            render: (name) => name || 'N/A'
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
            render: plan => <Tag color="purple">{plan?.toUpperCase()}</Tag>
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: date => date ? new Date(date).toLocaleDateString() : 'N/A'
        },
        {
            title: 'Expiry Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: date => date ? new Date(date).toLocaleDateString() : 'N/A'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                const color = status === 'active' ? 'green' : status === 'expired' ? 'red' : 'orange';
                return <Tag color={color}>{status?.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        type={record.status === 'active' ? 'default' : 'primary'}
                        danger={record.status === 'active'}
                        icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => handleStatusChange(record._id, record.status)}
                    >
                        {record.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button size="small" onClick={() => handleRenewSubscription(record._id)}>
                        Renew
                    </Button>
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record._id)}>
                        History
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div className="welcome-section" style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ marginBottom: '8px' }}>Subscription Management</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>Manage pharmacy subscription plans, billing and activations</Text>
            </div>

            {/* Stats Banner Mini */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col span={24}>
                    <div className="stats-banner-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                        <div className="banner-stat">
                            <Text type="secondary" style={{ fontSize: '13px' }}>Active Subscriptions</Text>
                            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{stats.active}</Title>
                        </div>
                        <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                        <div className="banner-stat">
                            <Text type="secondary" style={{ fontSize: '13px' }}>Monthly Revenue</Text>
                            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>ETB {stats.monthlyRevenue}</Title>
                        </div>
                        <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                        <div className="banner-stat">
                            <Text type="secondary" style={{ fontSize: '13px' }}>Renewals (30d)</Text>
                            <Title level={2} style={{ margin: 0, color: '#faad14' }}>{stats.expiring}</Title>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card
                        title="Available Plans"
                        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignModal(true)}>Assign Subscription</Button>}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <Text type="secondary" style={{ fontSize: '13px' }}>Tiered subscription packages for partner pharmacies</Text>
                        </div>
                        <Row gutter={16}>
                            {plans.map(plan => (
                                <Col xs={24} md={8} key={plan.name}>
                                    <div style={{
                                        height: '100%',
                                        padding: '24px',
                                        borderRadius: '16px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <Tag color={plan.name === 'Premium' ? 'gold' : plan.name === 'Standard' ? 'blue' : 'default'} style={{ marginBottom: '8px', borderRadius: '4px' }}>
                                                {plan.name.toUpperCase()}
                                            </Tag>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <Title level={3} style={{ margin: 0 }}>{plan.price === 'Free' ? 'Free' : plan.price.split(' ')[0]}</Title>
                                                <Text type="secondary" style={{ fontSize: '14px' }}>{plan.price.includes('ETB') ? 'ETB/mo' : ''}</Text>
                                            </div>
                                        </div>

                                        <div style={{ flexGrow: 1 }}>
                                            <List
                                                size="small"
                                                dataSource={plan.features}
                                                renderItem={feature => (
                                                    <List.Item style={{ border: 'none', padding: '6px 0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '15px', marginTop: '3px' }} />
                                                        <Text style={{ fontSize: '14px', color: '#475569' }}>{feature}</Text>
                                                    </List.Item>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Pharmacy Subscriptions">
                        <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary" style={{ fontSize: '13px' }}>Comprehensive list of active, pending, and suspended pharmacy plans</Text>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={subscriptions}
                            loading={loading}
                            rowKey="_id"
                            size="middle"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Assign Subscription Modal */}
            <Modal
                title="Assign Subscription"
                open={assignModal}
                onCancel={() => {
                    setAssignModal(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleAssignSubscription}>
                    <Form.Item
                        name="pharmacy"
                        label="Select Pharmacy"
                        rules={[{ required: true, message: 'Please select a pharmacy' }]}
                    >
                        <Select placeholder="Choose pharmacy">
                            {pharmacies.map(p => (
                                <Option key={p._id} value={p._id}>{p.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="plan"
                        label="Subscription Plan"
                        rules={[{ required: true, message: 'Please select a plan' }]}
                    >
                        <Select placeholder="Choose plan">
                            {plans.map(plan => (
                                <Option key={plan.id} value={plan.id}>
                                    {plan.name} ({plan.price})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="duration"
                        label="Duration (Months)"
                        rules={[{ required: true, message: 'Please specify duration' }]}
                        initialValue={12}
                    >
                        <Select>
                            <Option value={1}>1 Month</Option>
                            <Option value={3}>3 Months</Option>
                            <Option value={6}>6 Months</Option>
                            <Option value={12}>12 Months</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* History Drawer */}
            <Drawer
                title="Subscription History"
                placement="right"
                onClose={() => setHistoryOpen(false)}
                open={historyOpen}
                width={400}
            >
                <Timeline
                    items={historyData.map(item => ({
                        color: item.action === 'assigned' ? 'green' : item.action === 'suspended' ? 'red' : 'blue',
                        children: (
                            <>
                                <Text strong style={{ textTransform: 'capitalize' }}>{item.action}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(item.createdAt).toLocaleString()}</Text>
                                <br />
                                <Text>{item.details}</Text>
                                {item.performedBy && (
                                    <>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>By: {item.performedBy.firstName}</Text>
                                    </>
                                )}
                            </>
                        )
                    }))}
                />
            </Drawer>
        </div>
    );
};

export default SubscriptionManagement;
