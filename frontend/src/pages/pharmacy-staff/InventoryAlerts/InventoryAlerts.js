import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Tabs, Row, Col, Progress, Badge } from 'antd';
import { AlertOutlined, MedicineBoxOutlined, WarningOutlined, ThunderboltOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './InventoryAlerts.css';

const { TabPane } = Tabs;

const InventoryAlerts = () => {
    const [activeTab, setActiveTab] = useState('1');

    // Mock Data
    const alertsData = [
        {
            key: '1',
            name: 'Amoxicillin 500mg',
            category: 'Antibiotics',
            quantity: 12,
            minLevel: 20,
            expiryDate: '2024-12-31',
            type: 'Low Stock',
            status: 'Critical'
        },
        {
            key: '2',
            name: 'Insulin Glargine',
            category: 'Diabetes',
            quantity: 45,
            minLevel: 10,
            expiryDate: '2024-02-15',
            type: 'Expiring Soon',
            status: 'Warning'
        },
        {
            key: '3',
            name: 'Cetirizine 10mg',
            category: 'Antihistamine',
            quantity: 5,
            minLevel: 25,
            expiryDate: '2025-06-30',
            type: 'Low Stock',
            status: 'Critical'
        },
        {
            key: '4',
            name: 'Aspirin 81mg',
            category: 'Pain Relief',
            quantity: 120,
            minLevel: 50,
            expiryDate: '2024-01-25',
            type: 'Expiring Soon',
            status: 'Urgent'
        },
        {
            key: '5',
            name: 'Metformin 500mg',
            category: 'Diabetes',
            quantity: 8,
            minLevel: 30,
            expiryDate: '2025-01-01',
            type: 'Low Stock',
            status: 'Critical'
        }
    ];

    const lowStockItems = alertsData.filter(item => item.type === 'Low Stock');
    const expiringItems = alertsData.filter(item => item.type === 'Expiring Soon');

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
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                let color = 'default';
                let icon = null;
                if (type === 'Low Stock') {
                    color = 'volcano';
                    icon = <ThunderboltOutlined />;
                } else if (type === 'Expiring Soon') {
                    color = 'orange';
                    icon = <WarningOutlined />;
                }
                return <Tag color={color} icon={icon}>{type}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: () => (
                <Button size="small">Restock</Button>
            ),
        }
    ];

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
                                <div className="stat-value">Fresh Stock</div>
                                <div className="stat-label">Stock Status OK</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card className="alerts-table-card" bordered={false}>
                <Tabs defaultActiveKey="1" onChange={setActiveTab}>
                    <TabPane
                        tab={
                            <span>
                                <AlertOutlined />
                                All Alerts
                                <Badge count={alertsData.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                            </span>
                        }
                        key="1"
                    >
                        <Table columns={columns} dataSource={alertsData} pagination={{ pageSize: 8 }} />
                    </TabPane>
                    <TabPane
                        tab={<span><ThunderboltOutlined /> Low Stock</span>}
                        key="2"
                    >
                        <Table columns={columns} dataSource={lowStockItems} pagination={{ pageSize: 8 }} />
                    </TabPane>
                    <TabPane
                        tab={<span><WarningOutlined /> Expiring Soon</span>}
                        key="3"
                    >
                        <Table columns={columns} dataSource={expiringItems} pagination={{ pageSize: 8 }} />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default InventoryAlerts;
