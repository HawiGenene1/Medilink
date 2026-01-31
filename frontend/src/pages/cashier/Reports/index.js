import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Tabs, Table, Progress, Button, Space, Tag, List, message } from 'antd';
import {
    DownloadOutlined,
    BarChartOutlined,
    TransactionOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    PrinterOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { cashierAPI } from '../../../services/api/cashier';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await cashierAPI.getRevenueReport();

            if (response.data.success) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Generating Reports...">
                    <div style={{ minWidth: 200 }} />
                </Spin>
            </div>
        );
    }

    if (!report) {
        return (
            <div style={{ padding: 24 }}>
                <Empty description="No report data available" />
            </div>
        );
    }

    const renderGeneralTab = () => (
        <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Today's Revenue"
                            value={report.today.revenue}
                            precision={2}
                            prefix="ETB"
                            valueStyle={{ color: '#3f8600' }}
                        />
                        <Text type="secondary">{report.today.transactions} transactions</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Week to Date"
                            value={report.week.revenue}
                            precision={2}
                            prefix="ETB"
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <Text type="secondary">{report.week.transactions} transactions</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Month to Date"
                            value={report.month.revenue}
                            precision={2}
                            prefix="ETB"
                            valueStyle={{ color: '#722ed1' }}
                        />
                        <Text type="secondary">{report.month.transactions} transactions</Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={14}>
                    <Card title="Payment Method Mix" size="small">
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={report.paymentMethodBreakdown || []}
                            columns={[
                                { title: 'Method', dataIndex: '_id', key: 'id', render: (val) => <Tag color="blue">{val?.toUpperCase()}</Tag> },
                                { title: 'Count', dataIndex: 'count', key: 'count' },
                                {
                                    title: 'Amount',
                                    dataIndex: 'total',
                                    key: 'total',
                                    render: (val) => `ETB ${val.toFixed(2)}`,
                                    sorter: (a, b) => a.total - b.total
                                },
                                {
                                    title: '%',
                                    key: 'pct',
                                    render: (_, rec) => {
                                        const total = report.paymentMethodBreakdown.reduce((acc, curr) => acc + curr.total, 0);
                                        return `${((rec.total / total) * 100).toFixed(1)}%`;
                                    }
                                }
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={10}>
                    <Card title="Quick Analysis" size="small">
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Average Transaction Value</Text>
                            <Title level={4} style={{ margin: '4px 0' }}>
                                ETB {(report.today.revenue / (report.today.transactions || 1)).toFixed(2)}
                            </Title>
                        </div>
                        <div>
                            <Text strong>Refund Rate</Text>
                            <Progress
                                percent={Math.round((report.today.refunds / (report.today.transactions || 1)) * 100)}
                                status="exception"
                                style={{ marginTop: 8 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>{report.today.refunds} refunds today</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    );

    const renderShiftTab = () => (
        <Card size="small" title="Current Shift Report (08:00 AM - Present)">
            <Row gutter={[32, 32]}>
                <Col span={12}>
                    <List
                        header={<Text strong>Cash Management</Text>}
                        bordered
                        dataSource={[
                            { label: 'Opening Balance', value: 'ETB 1,000.00' },
                            { label: 'Cash Sales', value: `ETB ${report.paymentMethodBreakdown?.find(m => m._id === 'cash')?.total.toFixed(2) || '0.00'}` },
                            { label: 'Cash Refunds', value: `ETB ${report.today.refundAmount?.toFixed(2) || '0.00'}` },
                            { label: 'Expected Cash in Drawer', value: 'ETB 1,450.00', strong: true }
                        ]}
                        renderItem={item => (
                            <List.Item extra={<Text strong={item.strong}>{item.value}</Text>}>
                                {item.label}
                            </List.Item>
                        )}
                    />
                </Col>
                <Col span={12}>
                    <Title level={5}>Shift Performance</Title>
                    <div style={{ marginBottom: 16 }}>
                        <Text>Total Transactions</Text>
                        <Title level={3} style={{ margin: 0 }}>{report.today.transactions}</Title>
                    </div>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic title="Successful" value={report.today.transactions} valueStyle={{ color: '#52c41a' }} />
                        </Col>
                        <Col span={12}>
                            <Statistic title="Failed/Voided" value={report.failedCount} valueStyle={{ color: '#f5222d' }} />
                        </Col>
                    </Row>
                    <Button type="primary" block icon={<PrinterOutlined />} style={{ marginTop: 24 }}>
                        Print Shift X-Report
                    </Button>
                </Col>
            </Row>
        </Card>
    );

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Reports & Analytics</Title>
                <Space>
                    <Button icon={<FilePdfOutlined />}>Export PDF</Button>
                    <Button icon={<FileExcelOutlined />}>Excel</Button>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={fetchReport}>Refresh</Button>
                </Space>
            </div>

            <Tabs defaultActiveKey="1" type="card">
                <TabPane tab={<span><BarChartOutlined /> Overview</span>} key="1">
                    {renderGeneralTab()}
                </TabPane>
                <TabPane tab={<span><ClockCircleOutlined /> Shift Report</span>} key="2">
                    {renderShiftTab()}
                </TabPane>
                <TabPane tab={<span><TeamOutlined /> Performance</span>} key="3">
                    <Card>
                        <Empty description="Detailed performance analytics coming soon" />
                    </Card>
                </TabPane>
            </Tabs>
        </div>
    );
};

export default Reports;
