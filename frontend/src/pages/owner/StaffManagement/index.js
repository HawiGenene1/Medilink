import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Card,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Checkbox,
    Space,
    Tag,
    Typography,
    message,
    Popconfirm,
    Divider,
    Row,
    Col
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { pharmacyOwnerAPI } from '../../../services/api';
import './StaffManagement.css';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffManagement = () => {
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [form] = Form.useForm();
    const { user } = useAuth();

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await pharmacyOwnerAPI.getStaff();
            if (response.data.success) {
                setStaff(response.data.data);
            }
        } catch (error) {
            if (error.response?.status !== 401) {
                message.error('Failed to load staff list');
            }
        } finally {
            setLoading(false);
        }
    };

    const ownerPermissions = user?.permissions || [];

    const handleAdd = () => {
        setEditingStaff(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingStaff(record);
        // Flatten permissions for form initial values
        const formValues = {
            firstName: record.user?.firstName,
            lastName: record.user?.lastName,
            email: record.user?.email,
            phone: record.user?.phone,
            role: record.role,
            isActive: record.isActive,
            permissions: record.permissions
        };
        form.setFieldsValue(formValues);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            const response = await pharmacyOwnerAPI.deleteStaff(id);
            if (response.data.success) {
                message.success('Staff member removed successfully');
                fetchStaff();
            }
        } catch (error) {
            message.error('Failed to delete staff member');
        }
    };

    const onFinish = async (values) => {
        try {
            let response;
            if (editingStaff) {
                response = await pharmacyOwnerAPI.updateStaff(editingStaff._id, values);
            } else {
                response = await pharmacyOwnerAPI.createStaff(values);
            }

            if (response.data.success) {
                message.success(`Staff member ${editingStaff ? 'updated' : 'created'} successfully`);
                setIsModalOpen(false);
                fetchStaff();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save staff member');
        }
    };

    const checkPermissionArea = (area) => ownerPermissions.includes(area);

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (text, record) => (
                <span>{record.user?.firstName} {record.user?.lastName}</span>
            ),
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => <Tag color="blue">{role.toUpperCase()}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        type="text"
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this staff member?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            type="text"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="staff-management">
            <div className="page-header">
                <div>
                    <Space size="middle" align="center">
                        <Title level={2} style={{ marginBottom: 0 }}>Staff Management</Title>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Manage your pharmacy team and their access permissions.</Text>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleAdd}
                >
                    Add New Staff
                </Button>
            </div>

            <Card bordered={false} className="staff-table-card">
                <Table
                    columns={columns}
                    dataSource={staff}
                    rowKey="_id"
                    loading={loading}
                />
            </Card>

            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '32px' }}>
                        <span>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        role: 'cashier',
                        isActive: true,
                        permissions: {
                            inventory: { view: true, add: false, edit: false, delete: false },
                            orders: { view: true, process: false, cancel: false },
                            customers: { view: true, add: false, edit: false }
                        }
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="firstName"
                                label="First Name"
                                rules={[{ required: true, message: 'Please input first name' }]}
                            >
                                <Input placeholder="John" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="lastName"
                                label="Last Name"
                                rules={[{ required: true, message: 'Please input last name' }]}
                            >
                                <Input placeholder="Doe" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please input email' },
                                    { type: 'email', message: 'Enter a valid email' }
                                ]}
                            >
                                <Input placeholder="john@example.com" disabled={!!editingStaff} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone Number"
                                rules={[{ required: true, message: 'Please input phone number' }]}
                            >
                                <Input placeholder="+251 911 22 33 44" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="role"
                                label="System Role"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="pharmacist">Pharmacist</Option>
                                    <Option value="cashier">Cashier</Option>
                                    <Option value="staff">Staff</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            {!editingStaff && (
                                <Form.Item
                                    name="password"
                                    label="Password"
                                    rules={[{ required: true, message: 'Please input password' }]}
                                >
                                    <Input.Password placeholder="******" />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>

                    <Form.Item
                        name="isActive"
                        label="Account Status"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Divider orientation="left">
                        <Space>
                            <SafetyCertificateOutlined />
                            <span>Permissions & Access Control</span>
                        </Space>
                    </Divider>

                    <div className="permissions-section">
                        {/* Inventory Permissions */}
                        {checkPermissionArea('inventory') && (
                            <div className="permission-group">
                                <Text strong>Inventory Management</Text>
                                <div className="permission-checks">
                                    <Form.Item name={['permissions', 'inventory', 'view']} valuePropName="checked" noStyle>
                                        <Checkbox>View</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'inventory', 'add']} valuePropName="checked" noStyle>
                                        <Checkbox>Add Items</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'inventory', 'edit']} valuePropName="checked" noStyle>
                                        <Checkbox>Edit Items</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'inventory', 'delete']} valuePropName="checked" noStyle>
                                        <Checkbox>Delete Items</Checkbox>
                                    </Form.Item>
                                </div>
                            </div>
                        )}

                        {/* Order Permissions */}
                        {checkPermissionArea('orders') && (
                            <div className="permission-group">
                                <Text strong>Order Oversight & Processing</Text>
                                <div className="permission-checks">
                                    <Form.Item name={['permissions', 'orders', 'view']} valuePropName="checked" noStyle>
                                        <Checkbox>View Orders</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'orders', 'process']} valuePropName="checked" noStyle>
                                        <Checkbox>Process Orders</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'orders', 'cancel']} valuePropName="checked" noStyle>
                                        <Checkbox>Cancel Orders</Checkbox>
                                    </Form.Item>
                                </div>
                            </div>
                        )}

                        {/* Customer Permissions */}
                        {checkPermissionArea('customers') && (
                            <div className="permission-group">
                                <Text strong>Customer Management</Text>
                                <div className="permission-checks">
                                    <Form.Item name={['permissions', 'customers', 'view']} valuePropName="checked" noStyle>
                                        <Checkbox>View Records</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'customers', 'add']} valuePropName="checked" noStyle>
                                        <Checkbox>Add Customers</Checkbox>
                                    </Form.Item>
                                    <Form.Item name={['permissions', 'customers', 'edit']} valuePropName="checked" noStyle>
                                        <Checkbox>Edit Records</Checkbox>
                                    </Form.Item>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                {editingStaff ? 'Update Staff member' : 'Create Staff Member'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffManagement;
