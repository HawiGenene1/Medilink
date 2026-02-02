import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Steps, List, Card, message, Alert, Select, Checkbox, Space, Descriptions, Tag } from 'antd';
import { DollarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import cashierPOSService from '../../../services/cashierPOS';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const RefundModal = ({ visible, onClose, transaction, onRefundComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [eligibility, setEligibility] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [refundData, setRefundData] = useState({
        refundMethod: 'cash',
        refundReason: 'customer_request',
        refundReasonDetails: ''
    });
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && transaction) {
            checkEligibility();
        }
    }, [visible, transaction]);

    const checkEligibility = async () => {
        try {
            setLoading(true);
            const response = await cashierPOSService.checkRefundEligibility(transaction._id);

            if (response.data.success) {
                setEligibility(response.data.data);

                if (!response.data.data.eligible) {
                    message.warning('This transaction may not be eligible for refund');
                }
            }
        } catch (error) {
            message.error('Failed to check refund eligibility');
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelection = (item, quantity) => {
        const existingIndex = selectedItems.findIndex(i => i.medicine === item.medicine._id);

        if (quantity === 0 && existingIndex > -1) {
            setSelectedItems(selectedItems.filter((_, i) => i !== existingIndex));
        } else if (existingIndex > -1) {
            const updated = [...selectedItems];
            updated[existingIndex] = {
                medicine: item.medicine._id,
                quantity,
                price: item.price,
                reason: 'Customer request'
            };
            setSelectedItems(updated);
        } else if (quantity > 0) {
            setSelectedItems([...selectedItems, {
                medicine: item.medicine._id,
                quantity,
                price: item.price,
                reason: 'Customer request'
            }]);
        }
    };

    const handleInitiateRefund = async () => {
        if (selectedItems.length === 0) {
            message.warning('Please select at least one item to refund');
            return;
        }

        try {
            setLoading(true);
            const response = await cashierPOSService.initiateRefund({
                transactionId: transaction._id,
                refundItems: selectedItems,
                refundMethod: refundData.refundMethod,
                refundReason: refundData.refundReason,
                refundReasonDetails: refundData.refundReasonDetails
            });

            if (response.data.success) {
                message.success(response.data.message || 'Refund initiated successfully');

                if (onRefundComplete) {
                    onRefundComplete(response.data.data);
                }

                handleClose();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to initiate refund');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentStep(0);
        setSelectedItems([]);
        setEligibility(null);
        form.resetFields();
        onClose();
    };

    const calculateRefundAmount = () => {
        return selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                // Step 1: Eligibility Check
                return (
                    <div>
                        {eligibility ? (
                            eligibility.eligible ? (
                                <Alert
                                    message="Transaction Eligible for Refund"
                                    description="This transaction meets all refund criteria"
                                    type="success"
                                    showIcon
                                    icon={<CheckCircleOutlined />}
                                />
                            ) : (
                                <Alert
                                    message="Refund Restrictions"
                                    description={
                                        <ul>
                                            {eligibility.reasons.map((reason, index) => (
                                                <li key={index}>{reason}</li>
                                            ))}
                                        </ul>
                                    }
                                    type="warning"
                                    showIcon
                                    icon={<CloseCircleOutlined />}
                                />
                            )
                        ) : (
                            <div>Checking eligibility...</div>
                        )}

                        {eligibility && (
                            <Card title="Transaction Details" style={{ marginTop: '16px' }}>
                                <Descriptions size="small" column={1}>
                                    <Descriptions.Item label="Order Number">
                                        {transaction.orderNumber}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date">
                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Total Amount">
                                        ETB {transaction.finalAmount?.toFixed(2)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Payment Method">
                                        <Tag>{transaction.paymentMethod}</Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        )}
                    </div>
                );

            case 1:
                // Step 2: Select Items
                return (
                    <div>
                        <Alert
                            message="Select Items to Refund"
                            description="Choose items and quantities to refund"
                            type="info"
                            style={{ marginBottom: '16px' }}
                        />

                        <List
                            dataSource={transaction.items || []}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.medicine?.name || item.name}
                                        description={`Price: ETB ${item.price} | Ordered: ${item.quantity}`}
                                    />
                                    <InputNumber
                                        min={0}
                                        max={item.quantity}
                                        defaultValue={0}
                                        onChange={(value) => handleItemSelection(item, value || 0)}
                                        addonAfter="qty"
                                    />
                                </List.Item>
                            )}
                        />

                        <Card style={{ marginTop: '16px', background: '#f0f5ff' }}>
                            <strong>Refund Amount: ETB {calculateRefundAmount().toFixed(2)}</strong>
                        </Card>
                    </div>
                );

            case 2:
                // Step 3: Refund Details
                return (
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Refund Method"
                            name="refundMethod"
                            initialValue={refundData.refundMethod}
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                onChange={(value) => setRefundData({ ...refundData, refundMethod: value })}
                            >
                                <Option value="cash">Cash</Option>
                                <Option value="chapa">Chapa</Option>
                                <Option value="card">Card</Option>
                                <Option value="store_credit">Store Credit</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Refund Reason"
                            name="refundReason"
                            initialValue={refundData.refundReason}
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                onChange={(value) => setRefundData({ ...refundData, refundReason: value })}
                            >
                                <Option value="damaged_product">Damaged Product</Option>
                                <Option value="wrong_item">Wrong Item</Option>
                                <Option value="expired_product">Expired Product</Option>
                                <Option value="customer_request">Customer Request</Option>
                                <Option value="quality_issue">Quality Issue</Option>
                                <Option value="other">Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Additional Details"
                            name="refundReasonDetails"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Provide additional details about the refund..."
                                onChange={(e) => setRefundData({ ...refundData, refundReasonDetails: e.target.value })}
                            />
                        </Form.Item>

                        <Card style={{ background: '#fff7e6' }}>
                            <Descriptions size="small" column={1}>
                                <Descriptions.Item label="Items">
                                    {selectedItems.length} item(s)
                                </Descriptions.Item>
                                <Descriptions.Item label="Refund Amount">
                                    <strong>ETB {calculateRefundAmount().toFixed(2)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Method">
                                    {refundData.refundMethod}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Form>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            title="Process Refund"
            open={visible}
            onCancel={handleClose}
            width={700}
            footer={
                <Space>
                    {currentStep > 0 && (
                        <Button onClick={() => setCurrentStep(currentStep - 1)}>
                            Previous
                        </Button>
                    )}
                    <Button onClick={handleClose}>Cancel</Button>
                    {currentStep < 2 ? (
                        <Button
                            type="primary"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={currentStep === 1 && selectedItems.length === 0}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleInitiateRefund}
                            loading={loading}
                        >
                            Initiate Refund
                        </Button>
                    )}
                </Space>
            }
        >
            <Steps current={currentStep} style={{ marginBottom: '24px' }}>
                <Step title="Check Eligibility" />
                <Step title="Select Items" />
                <Step title="Refund Details" />
            </Steps>

            {renderStepContent()}
        </Modal>
    );
};

export default RefundModal;
