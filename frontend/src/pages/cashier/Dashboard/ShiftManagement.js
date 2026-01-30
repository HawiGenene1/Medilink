import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Statistic, Row, Col, Card, Divider, message, Alert, Space } from 'antd';
import { ClockCircleOutlined, CoffeeOutlined, LogoutOutlined } from '@ant-design/icons';
import cashierPOSService from '../../../services/cashierPOS';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const ShiftManagement = ({ visible, onClose, onShiftUpdate, currentShift: propShift }) => {
    const [currentShift, setCurrentShift] = useState(propShift || null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [endShiftForm] = Form.useForm();
    const [showEndShiftForm, setShowEndShiftForm] = useState(false);

    useEffect(() => {
        if (visible) {
            if (propShift) {
                setCurrentShift(propShift);
            } else {
                fetchCurrentShift();
            }
        }
    }, [visible, propShift]);

    const fetchCurrentShift = async () => {
        try {
            setLoading(true);
            const response = await cashierPOSService.getCurrentShift();
            if (response.data.success) {
                setCurrentShift(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching shift:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartShift = async (values) => {
        try {
            setLoading(true);
            const response = await cashierPOSService.startShift(values.openingCash);

            if (response.data.success) {
                message.success('Shift started successfully!');
                setCurrentShift(response.data.data);
                form.resetFields();
                if (onShiftUpdate) onShiftUpdate(response.data.data);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to start shift');
        } finally {
            setLoading(false);
        }
    };

    const handleTakeBreak = async () => {
        try {
            setLoading(true);
            const response = await cashierPOSService.takeBreak();

            if (response.data.success) {
                message.success('Break started');
                setCurrentShift(response.data.data);
                if (onShiftUpdate) onShiftUpdate(response.data.data);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to take break');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeShift = async () => {
        try {
            setLoading(true);
            const response = await cashierPOSService.resumeShift();

            if (response.data.success) {
                message.success('Resumed from break');
                setCurrentShift(response.data.data);
                if (onShiftUpdate) onShiftUpdate(response.data.data);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to resume shift');
        } finally {
            setLoading(false);
        }
    };

    const handleEndShift = async (values) => {
        try {
            setLoading(true);
            const response = await cashierPOSService.endShift(values.closingCash, values.notes);

            if (response.data.success) {
                message.success('Shift ended successfully!');
                setCurrentShift(null);
                setShowEndShiftForm(false);
                endShiftForm.resetFields();
                if (onShiftUpdate) onShiftUpdate(null);
                onClose();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to end shift');
        } finally {
            setLoading(false);
        }
    };

    const calculateShiftDuration = () => {
        if (!currentShift) return '0h 0m';
        const start = dayjs(currentShift.startTime);
        const now = dayjs();
        const diff = dayjs.duration(now.diff(start));
        return `${Math.floor(diff.asHours())}h ${diff.minutes()}m`;
    };

    const renderNoShift = () => (
        <div style={{ padding: '20px' }}>
            <Alert
                message="No Active Shift"
                description="Start your shift to begin processing transactions"
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
            />

            <Form form={form} onFinish={handleStartShift} layout="vertical">
                <Form.Item
                    label="Opening Cash Amount (ETB)"
                    name="openingCash"
                    rules={[
                        { required: true, message: 'Please enter opening cash amount' },
                        { type: 'number', min: 0, message: 'Amount must be positive' }
                    ]}
                    initialValue={0}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        prefix="ETB "
                        placeholder="Enter opening cash"
                        min={0}
                        step={100}
                    />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    icon={<ClockCircleOutlined />}
                >
                    Start Shift
                </Button>
            </Form>
        </div>
    );

    const renderActiveShift = () => (
        <div style={{ padding: '20px' }}>
            <Card style={{ marginBottom: '16px', background: '#f0f5ff' }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic
                            title="Shift Number"
                            value={currentShift.shiftNumber}
                            valueStyle={{ fontSize: '16px' }}
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic
                            title="Duration"
                            value={calculateShiftDuration()}
                            valueStyle={{ fontSize: '16px' }}
                        />
                    </Col>
                </Row>
            </Card>

            <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Opening Cash"
                            value={currentShift.openingCash}
                            prefix="ETB "
                            valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Sales"
                            value={currentShift.totalSales || 0}
                            prefix="ETB "
                            valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Transactions"
                            value={currentShift.transactionCount || 0}
                            valueStyle={{ fontSize: '18px' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider />

            {!showEndShiftForm ? (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {currentShift.status === 'active' && (
                        <Button
                            icon={<CoffeeOutlined />}
                            size="large"
                            block
                            onClick={handleTakeBreak}
                            loading={loading}
                        >
                            Take Break
                        </Button>
                    )}

                    {currentShift.status === 'on_break' && (
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleResumeShift}
                            loading={loading}
                        >
                            Resume Shift
                        </Button>
                    )}

                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        size="large"
                        block
                        onClick={() => setShowEndShiftForm(true)}
                    >
                        End Shift
                    </Button>
                </Space>
            ) : (
                <div>
                    <Alert
                        message="End Shift Reconciliation"
                        description="Please count and enter the closing cash amount"
                        type="warning"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />

                    <Form form={endShiftForm} onFinish={handleEndShift} layout="vertical">
                        <Form.Item
                            label="Closing Cash Amount (ETB)"
                            name="closingCash"
                            rules={[
                                { required: true, message: 'Please enter closing cash amount' },
                                { type: 'number', min: 0, message: 'Amount must be positive' }
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                size="large"
                                prefix="ETB "
                                placeholder="Enter closing cash"
                                min={0}
                                step={100}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Notes (Optional)"
                            name="notes"
                        >
                            <Input.TextArea rows={3} placeholder="Any notes about this shift..." />
                        </Form.Item>

                        <Space style={{ width: '100%' }}>
                            <Button onClick={() => setShowEndShiftForm(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                htmlType="submit"
                                loading={loading}
                            >
                                Confirm End Shift
                            </Button>
                        </Space>
                    </Form>
                </div>
            )}
        </div>
    );

    return (
        <Modal
            title={currentShift ? "Manage Shift" : "Start Shift"}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            {loading && !currentShift ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : (
                currentShift ? renderActiveShift() : renderNoShift()
            )}
        </Modal>
    );
};

export default ShiftManagement;
