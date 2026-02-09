import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Button,
    Card,
    Row,
    Col,
    Divider,
    Space,
    Typography,
    message,
    Breadcrumb,
    Alert,
    Tooltip
} from 'antd';
import {
    MedicineBoxOutlined,
    InboxOutlined,
    DollarOutlined,
    SafetyOutlined,
    SolutionOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI, medicinesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const AddInventory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form] = Form.useForm();
    const expiryDate = Form.useWatch('expiryDate', form);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [catalogResults, setCatalogResults] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [isManualEntry, setIsManualEntry] = useState(false);

    // Permissions check: Staff always have access if they are on the page.
    // Owners have strict permission-based access (Oversight Mode toggle).
    const role = user?.role?.toLowerCase();
    const isStaff = ['staff', 'pharmacist', 'technician', 'cashier', 'assistant', 'pharmacy_staff'].includes(role);
    const canEditPricing = isStaff || (role === 'pharmacy_owner' && user?.operationalPermissions?.managePricing !== false);

    const handleSearchCatalog = async (value) => {
        if (!value || value.length < 2) return;
        try {
            setSearchLoading(true);
            const res = await medicinesAPI.search(value);
            if (res.data.success) {
                const results = res.data.data?.medicines || res.data.medicines || [];
                setCatalogResults(results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const onMedicineSelect = (medicineId) => {
        const medicine = catalogResults.find(m => m._id === medicineId);
        if (medicine) {
            setSelectedMedicine(medicine);
            setIsManualEntry(false);
            form.setFieldsValue({
                medicineId: medicine._id,
                name: medicine.name,
                genericName: medicine.genericName,
                brand: medicine.brand,
                category: typeof medicine.category === 'object' ? (medicine.category.slug || medicine.category.name?.toLowerCase()) : medicine.category,
                dosageForm: medicine.dosageForm,
                strength: medicine.strength,
                packSize: medicine.packSize,
                manufacturer: medicine.manufacturer,
                requiresPrescription: medicine.prescriptionRequired,
                sellingPrice: medicine.price?.basePrice || 0
            });
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            // Format dates
            const payload = { ...values };
            if (values.expiryDate) payload.expiryDate = values.expiryDate.format('YYYY-MM-DD');
            if (values.manufactureDate) payload.manufactureDate = values.manufactureDate.format('YYYY-MM-DD');
            if (values.dateReceived) payload.dateReceived = values.dateReceived.format('YYYY-MM-DD');

            const res = await inventoryAPI.add(payload);
            if (res.data.success) {
                message.success('Stock added successfully to inventory');
                navigate('/owner/inventory');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to add inventory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Breadcrumb style={{ marginBottom: 8 }}>
                        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                        <Breadcrumb.Item href="/owner/inventory">Inventory</Breadcrumb.Item>
                        <Breadcrumb.Item>Add New Stock</Breadcrumb.Item>
                    </Breadcrumb>
                    <Title level={2} style={{ marginBottom: 0 }}>
                        <Space>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/owner/inventory')}
                            />
                            Add Inventory Entry
                        </Space>
                    </Title>
                    <Text type="secondary">Record new pharmaceutical arrivals and update stock levels.</Text>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    currency: 'Birr',
                    unitType: 'Piece',
                    expiryAlertThreshold: 90,
                    storageCondition: 'Room Temperature',
                    dateReceived: dayjs()
                }}
            >
                <Row gutter={[24, 24]}>
                    {/* Left Column: Core Details */}
                    <Col xs={24} lg={16}>
                        {/* Section 1: Medicine Identification */}
                        <Card
                            title={<Space><MedicineBoxOutlined /> Medicine Details</Space>}
                            className="inventory-card"
                            style={{ borderRadius: '12px', marginBottom: 24 }}
                            extra={
                                <Button
                                    type={isManualEntry ? "primary" : "default"}
                                    onClick={() => {
                                        setIsManualEntry(!isManualEntry);
                                        if (!isManualEntry) {
                                            form.resetFields(['medicineId']);
                                            setSelectedMedicine(null);
                                        }
                                    }}
                                >
                                    {isManualEntry ? "Switch to Catalog Search" : "Manual Entry Mode"}
                                </Button>
                            }
                        >
                            {!isManualEntry ? (
                                <Form.Item
                                    label="Find in Global Catalog"
                                    name="medicineId"
                                    rules={[{ required: !isManualEntry, message: 'Please select a medicine' }]}
                                    tooltip="Search the central database for existing medicine specs"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Enter name, manufacturer, or generic name..."
                                        filterOption={false}
                                        onSearch={handleSearchCatalog}
                                        onChange={onMedicineSelect}
                                        loading={searchLoading}
                                        size="large"
                                        style={{ width: '100%', borderRadius: '8px' }}
                                    >
                                        {catalogResults.map(m => (
                                            <Option key={m._id} value={m._id}>
                                                <Text strong>{m.name}</Text> <Text type="secondary" size="small">({m.manufacturer}) - {m.strength}</Text>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : (
                                <Alert
                                    message="Manual Entry Active"
                                    description="You are creating a new record not currently in the global catalog."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 24 }}
                                />
                            )}

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Medicine Name" name="name" rules={[{ required: true }]}>
                                        <Input placeholder="Official Product Name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Generic Name" name="genericName">
                                        <Input placeholder="e.g. Paracetamol" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Brand Name" name="brand">
                                        <Input placeholder="Commercial Brand" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Manufacturer" name="manufacturer" rules={[{ required: true }]}>
                                        <Input placeholder="Producing Lab/Company" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item label="Category" name="category" rules={[{ required: true }]}>
                                        <Select placeholder="Select">
                                            <Option value="Analgesics & Antipyretics">Analgesics & Antipyretics</Option>
                                            <Option value="Antibiotics">Antibiotics</Option>
                                            <Option value="Antihypertensives">Antihypertensives</Option>
                                            <Option value="Antidiabetics">Antidiabetics</Option>
                                            <Option value="Cardiovascular Drugs">Cardiovascular Drugs</Option>
                                            <Option value="Respiratory Medicines">Respiratory Medicines</Option>
                                            <Option value="Gastrointestinal Medicines">Gastrointestinal Medicines</Option>
                                            <Option value="Vitamins & Supplements">Vitamins & Supplements</Option>
                                            <Option value="Dermatological Products">Dermatological Products</Option>
                                            <Option value="Others">Others</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="Dosage Form" name="dosageForm" rules={[{ required: true }]}>
                                        <Select placeholder="Form">
                                            <Option value="tablet">Tablet</Option>
                                            <Option value="capsule">Capsule</Option>
                                            <Option value="syrup">Syrup</Option>
                                            <Option value="injection">Injection</Option>
                                            <Option value="cream">Cream/Ointment</Option>
                                            <Option value="other">Other</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="Strength" name="strength" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. 500mg" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="Pack Size" name="packSize" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. 10x10" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Batch / Lot Number" name="batchNumber" rules={[{ required: true }]}>
                                        <Input prefix={<SolutionOutlined />} placeholder="Unique batch identifier" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Prescription Status" name="requiresPrescription" rules={[{ required: true }]}>
                                        <Select placeholder="Select status">
                                            <Option value={true}>Prescription Required</Option>
                                            <Option value={false}>Over the Counter (OTC)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Section 2: Expiry & Safety */}
                        <Card
                            title={<Space><SafetyOutlined /> Expiry & Safety</Space>}
                            style={{ borderRadius: '12px', marginBottom: 24 }}
                        >
                            {form.getFieldValue('expiryDate') && dayjs(form.getFieldValue('expiryDate')).isBefore(dayjs().add(90, 'day')) && (
                                <Alert
                                    message="Near Expiry Warning"
                                    description="The selected expiry date is within the next 90 days. This item may have a short shelf life."
                                    type="warning"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    style={{ marginBottom: 20 }}
                                />
                            )}
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Manufacture Date"
                                        name="manufactureDate"
                                        rules={[
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || value.isBefore(dayjs().endOf('day'))) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Cannot be in the future'));
                                                },
                                            })
                                        ]}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => current && current > dayjs().endOf('day')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Expiry Date"
                                        name="expiryDate"
                                        rules={[
                                            { required: true },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || value.isAfter(dayjs().startOf('day'))) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Medicine has already expired'));
                                                },
                                            })
                                        ]}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Storage Condition" name="storageCondition">
                                        <Select>
                                            <Option value="Room Temperature">Room Temperature (15-25°C)</Option>
                                            <Option value="Refrigerated">Refrigerated (2-8°C)</Option>
                                            <Option value="Frozen">Frozen (-18°C)</Option>
                                            <Option value="Cool Place">Cool & Dry Place</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Expiry Alert Threshold" name="expiryAlertThreshold" tooltip="Alert me X days before expiry">
                                        <Select>
                                            <Option value={30}>30 Days Before</Option>
                                            <Option value={60}>60 Days Before</Option>
                                            <Option value={90}>90 Days Before</Option>
                                            <Option value={180}>180 Days Before</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Section 3: Supplier Information */}
                        <Card title={<Space><InboxOutlined /> Procurement / Supplier</Space>} style={{ borderRadius: '12px' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Supplier Name" name="supplierName">
                                        <Input placeholder="Agency or Distributor" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Supplier Contact" name="supplierContact">
                                        <Input placeholder="Email or Phone (optional)" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Invoice / GRN Number" name="invoiceNumber">
                                        <Input placeholder="Ref #" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Date Received" name="dateReceived">
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => current && current > dayjs().endOf('day')}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Right Column: Numbers & Logistics */}
                    <Col xs={24} lg={8}>
                        {/* Section 4: Stock Levels */}
                        <Card title={<Space><InboxOutlined /> Stock Information</Space>} style={{ borderRadius: '12px', marginBottom: 24 }}>
                            <Form.Item label="Quantity to Add" name="quantity" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} placeholder="0" size="large" />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item label="Unit Type" name="unitType">
                                        <Select>
                                            <Option value="Piece">Piece / Unit</Option>
                                            <Option value="Strip">Strip</Option>
                                            <Option value="Box">Box</Option>
                                            <Option value="Bottle">Bottle</Option>
                                            <Option value="Vial">Vial</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Reorder Level" name="reorderLevel">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Current System Stock" tooltip="Total stock across all branches (Global Catalog)">
                                <Input value={selectedMedicine?.stockQuantity || 0} disabled />
                            </Form.Item>
                        </Card>

                        {/* Section 5: Financials */}
                        <Card title={<Space><DollarOutlined /> Pricing Details</Space>} style={{ borderRadius: '12px', marginBottom: 24 }}>
                            <Form.Item
                                label="Purchase Price (Net Cost)"
                                name="costPrice"
                                tooltip={!canEditPricing ? "Permission Restricted" : ""}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    precision={2}
                                    prefix="ETB"
                                    disabled={!canEditPricing}
                                />
                            </Form.Item>

                            <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true }]}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    precision={2}
                                    prefix="ETB"
                                    disabled={!canEditPricing}
                                    className={!canEditPricing ? "restricted-field" : ""}
                                />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={24}>
                                    <Form.Item label="Currency" name="currency">
                                        <Select disabled>
                                            <Option value="Birr">ETB (Ethiopian Birr)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={12}>
                                <Col span={24}>
                                    <Form.Item label="Tax / VAT (%)" name="tax">
                                        <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {!canEditPricing && (
                                <Alert
                                    message="Pricing Restricted"
                                    description="You don't have permissions to modify pricing. Only owners can edit these fields."
                                    type="warning"
                                    showIcon
                                    style={{ fontSize: '11px' }}
                                />
                            )}
                        </Card>

                        {/* Final Actions */}
                        <Card style={{ borderRadius: '12px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                icon={<SaveOutlined />}
                                loading={loading}
                                style={{ height: '54px', borderRadius: '8px', fontSize: '16px', fontWeight: 600 }}
                            >
                                Add to Inventory
                            </Button>
                            <Button
                                block
                                size="large"
                                style={{ marginTop: 12, borderRadius: '8px' }}
                                onClick={() => navigate('/owner/inventory')}
                            >
                                Cancel / Discard
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default AddInventory;
