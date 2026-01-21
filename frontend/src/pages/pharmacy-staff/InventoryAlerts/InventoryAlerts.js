import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Space, Tabs, Row, Col, Progress, Badge, message, Spin } from 'antd';
import { AlertOutlined, WarningOutlined, ThunderboltOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { medicinesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import './InventoryAlerts.css';

const { TabPane } = Tabs;

const InventoryAlerts = () => {
    const [activeTab, setActiveTab] = useState('1');
    const [loading, setLoading] = useState(false);
    const [medicines, setMedicines] = useState([]);
    const { user, loading: authLoading } = useAuth();

    const fetchAlerts = useCallback(async () => {
        if (!user?.pharmacyId) return;
        try {
            setLoading(true);
            const response = await medicinesAPI.getAll({ pharmacyId: user.pharmacyId });
            if (response.data.success) {
                const medicinesList = response.data.data.medicines || [];
                const formattedData = medicinesList.map(med => ({
                    key: med._id,
                    name: med.name,
                    category: med.category,
                    quantity: med.stockQuantity,
                    minLevel: med.minStockLevel || 10,
                    expiryDate: med.expiryDate ? dayjs(med.expiryDate).format('YYYY-MM-DD') : 'N/A',
                }));
                setMedicines(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
            message.error('Failed to load inventory alerts');
        } finally {
            setLoading(false);
        }
    }, [user?.pharmacyId]);

    useEffect(() => {
        if (user?.pharmacyId) {
            fetchAlerts();
        }
    }, [user, fetchAlerts]);

    const lowStockItems = medicines.filter(item => item.quantity < item.minLevel);
    const expiringItems = medicines.filter(item => {
        if (item.expiryDate === 'N/A') return false;
        const daysToExpiry = dayjs(item.expiryDate).diff(dayjs(), 'day');
        return daysToExpiry >= 0 && daysToExpiry < 30;
    });

    const allAlerts = [...new Set([...lowStockItems, ...expiringItems])];

    const columns = [
        {
            title: 'Medicine Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Stock Status',
            key: 'stock',
            render: (_, record) => {
                const percent = Math.min((record.quantity / record.minLevel) * 100, 100);
                return (
                    <div style={{ width: 140 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{record.quantity} left</span>
                            <span style={{ color: '#8c8c8c' }}>Min: {record.minLevel}</span>
                        </div>
                        <Progress
                            percent={percent}
                            size="small"
                            status={percent < 50 ? 'exception' : 'normal'}
                            showInfo={false}
                            strokeColor={record.quantity < record.minLevel ? '#ff4d4f' : '#faad14'}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => {
                const isExpiring = dayjs(date).diff(dayjs(), 'day') < 30;
                return (
                    <Tag icon={<ClockCircleOutlined />} color={isExpiring ? 'error' : 'default'}>
                        {date}
                    </Tag>
                );
            }
        },
        {
            title: 'Alert Type',
            key: 'type',
            render: (_, record) => {
                const isLowStock = record.quantity < record.minLevel;
                const isExpiring = record.expiryDate !== 'N/A' && dayjs(record.expiryDate).diff(dayjs(), 'day') < 30;

                let color = 'default';
                let icon = null;
                let label = '';

                if (isLowStock) {
                    color = 'volcano';
                    icon = <ThunderboltOutlined />;
                    label = 'Low Stock';
                } else if (isExpiring) {
                    color = 'orange';
                    icon = <WarningOutlined />;
                    label = 'Expiring Soon';
                }
                return <Tag color={color} icon={icon}>{label}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (record) => (
                <Button size="small" type="primary" onClick={() => message.info(`Restocking ${record.name}`)}>Restock</Button>
            ),
        }
    ];

    if (authLoading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading Alerts..." /></div>;
    }

    return (
        <div className="inventory-alerts-container">
            <Row gutter={[24, 24]} className="alerts-summary">
                <Col xs={24} sm={12} lg={8}>
                    <Card className="summary-card critical">
                        <Space align="start">
                            <div className="icon-box red"><AlertOutlined /></div>
                            <div>
                                <div className="stat-value">{lowStockItems.length}</div>
                                <div className="stat-label">Low Stock Items</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card className="summary-card warning">
                        <Space align="start">
                            <div className="icon-box orange"><WarningOutlined /></div>
                            <div>
                                <div className="stat-value">{expiringItems.length}</div>
                                <div className="stat-label">Expiring Soon</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card className="summary-card success">
                        <Space align="start">
                            <div className="icon-box green"><CheckCircleOutlined /></div>
                            <div>
                                <div className="stat-value">{medicines.length - allAlerts.length}</div>
                                <div className="stat-label">Healthy Stock</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button icon={<ReloadOutlined />} onClick={fetchAlerts} loading={loading}>Refresh Alerts</Button>
            </div>

            <Card className="alerts-table-card" bordered={false}>
                <Tabs defaultActiveKey="1" onChange={setActiveTab}>
                    <TabPane
                        tab={
                            <span>
                                <AlertOutlined />
                                All Alerts
                                <Badge count={allAlerts.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                            </span>
                        }
                        key="1"
                    >
                        <Table columns={columns} dataSource={allAlerts} loading={loading} pagination={{ pageSize: 8 }} />
                    </TabPane>
                    <TabPane
                        tab={<span><ThunderboltOutlined /> Low Stock</span>}
                        key="2"
                    >
                        <Table columns={columns} dataSource={lowStockItems} loading={loading} pagination={{ pageSize: 8 }} />
                    </TabPane>
                    <TabPane
                        tab={<span><WarningOutlined /> Expiring Soon</span>}
                        key="3"
                    >
                        <Table columns={columns} dataSource={expiringItems} loading={loading} pagination={{ pageSize: 8 }} />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default InventoryAlerts;
