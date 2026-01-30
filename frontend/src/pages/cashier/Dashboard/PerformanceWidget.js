import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import {
    RiseOutlined,
    FallOutlined,
    ShoppingOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const PerformanceWidget = ({ stats = {} }) => {
    const {
        totalSales = 0,
        transactionCount = 0,
        pendingPayments = 0,
        totalRefunds = 0,
        performanceMetrics = {}
    } = stats;

    const {
        averageTransactionValue = 0,
        transactionsPerHour = 0,
        refundRate = 0
    } = performanceMetrics;

    return (
        <Card title="Performance Metrics" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card size="small" style={{ background: '#f0f5ff', border: 'none' }}>
                        <Statistic
                            title="Avg Transaction"
                            value={averageTransactionValue}
                            precision={2}
                            prefix="ETB "
                            valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card size="small" style={{ background: '#f6ffed', border: 'none' }}>
                        <Statistic
                            title="Transactions/Hr"
                            value={transactionsPerHour}
                            precision={1}
                            suffix="/hr"
                            valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={24}>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Refund Rate</span>
                            <span style={{ fontWeight: 'bold' }}>{refundRate.toFixed(1)}%</span>
                        </div>
                        <Progress
                            percent={refundRate}
                            strokeColor={refundRate < 5 ? '#52c41a' : refundRate < 10 ? '#faad14' : '#ff4d4f'}
                            showInfo={false}
                        />
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            {refundRate < 5 ? 'Excellent' : refundRate < 10 ? 'Good' : 'Needs Attention'}
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default PerformanceWidget;
