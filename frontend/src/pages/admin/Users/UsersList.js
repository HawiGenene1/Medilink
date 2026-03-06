import React, { useState, useEffect } from 'react';
import {
    Table, Card, Button, Input, Select, Tag, Form,
    Space, Tooltip, Dropdown, Modal, message, Typography
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    UserAddOutlined,
    MoreOutlined,
    ExportOutlined,
    StopOutlined,
    CheckCircleOutlined,
    EditOutlined,
    KeyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const { Option } = Select;
const { Title } = Typography;

const UsersList = () => {
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // Create User Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                search: search || undefined,
                role: roleFilter || undefined,
                status: statusFilter || undefined
            };
            const response = await api.get('/admin/users', { params });
            if (response.data.success) {
                setUsers(response.data.data);
                setPagination(prev => ({ ...prev, total: response.data.count }));
            }
        } catch (error) {
            message.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [pagination.current, pagination.pageSize, roleFilter, statusFilter]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUsers();
    };

    const handleCreateUser = async (values) => {
        setCreateLoading(true);
        try {
            const response = await api.post('/admin/create-admin', values);
            if (response.data.success) {
                message.success('Pharmacy Admin created successfully');
                setIsModalVisible(false);
                form.resetFields();
                fetchUsers();
            }
        } catch (error) {
            console.error('Create User Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create user';
            message.error(`Error: ${errorMsg}`);
        } finally {
            setCreateLoading(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'firstName',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                        {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.firstName} {record.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{record.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: role => {
                let color = 'blue';
                let label = role.toUpperCase();
                if (role === 'admin') color = 'purple';
                if (role === 'system_admin') color = 'gold';
                if (role === 'pharmacy_admin') {
                    color = 'green';
                    label = 'PHARMACY ADMIN';
                }
                if (role === 'delivery') color = 'volcano';
                return <Tag color={color}>{label}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                const isActive = record.isActive !== false;
                return (
                    <Tag
                        color={status === 'active' || isActive ? 'success' : 'error'}
                        icon={(status === 'active' || isActive) ? <CheckCircleOutlined /> : <StopOutlined />}
                    >
                        {(status === 'active' || isActive) ? 'ACTIVE' : 'DISABLED'}
                    </Tag>
                );
            }
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record._id}`)}>View</Button>
                    </Tooltip>
                    <Dropdown
                        menu={{
                            items: [
                                { key: 'edit', label: 'Edit Role', icon: <EditOutlined /> },
                                { key: 'status', label: record.isActive !== false ? 'Disable Account' : 'Enable Account', icon: <StopOutlined />, danger: record.isActive !== false },
                                { key: 'reset', label: 'Reset Password', icon: <KeyOutlined /> },
                            ],
                            onClick: ({ key }) => handleUserAction(key, record)
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </Space>
            ),
        }
    ];

    const handleUserAction = async (action, user) => {
        try {
            if (action === 'status') {
                const endpoint = user.isActive !== false ? 'disable' : 'enable';
                const res = await api.patch(`/admin/users/${user._id}/${endpoint}`);
                if (res.data.success) {
                    message.success(`User ${endpoint}d successfully`);
                    fetchUsers();
                }
            } else if (action === 'reset') {
                Modal.confirm({
                    title: 'Reset Password',
                    content: (
                        <div>
                            <p>Are you sure you want to reset the password for {user.firstName}?</p>
                            <p>This will set a temporary password and force the user to change it on their next login.</p>
                            <Input.Password id="new-temp-password" placeholder="Temporary Password" style={{ marginTop: 10 }} />
                        </div>
                    ),
                    onOk: async () => {
                        const newPassword = document.getElementById('new-temp-password')?.value;
                        if (!newPassword) {
                            message.error('Please provide a temporary password');
                            return Promise.reject();
                        }
                        const res = await api.patch(`/admin/users/${user._id}/reset-password`, { newPassword });
                        if (res.data.success) {
                            message.success('Password reset successfully');
                        }
                    }
                });
            } else if (action === 'edit') {
                // TODO: Open edit role modal
                message.info('Edit role functionality coming soon');
            }
        } catch (error) {
            console.error('Action error:', error);
            message.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedRowKeys.length === 0) return;

        try {
            setLoading(true);
            const endpoint = action === 'Activate' ? 'enable' : 'disable';
            await Promise.all(selectedRowKeys.map(id =>
                api.patch(`/admin/users/${id}/${endpoint}`)
            ));
            message.success(`Successfully ${action.toLowerCase()}d ${selectedRowKeys.length} users`);
            setSelectedRowKeys([]);
            fetchUsers();
        } catch (error) {
            console.error('Bulk action error:', error);
            message.error('Failed to perform bulk action');
        } finally {
            setLoading(false);
        }
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleExportCSV = async () => {
        try {
            setLoading(true);
            const response = await api.post('/admin/data/export',
                { type: 'users', format: 'csv' },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('Users exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Failed to export users');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="users-list-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2}>User Management</Title>
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    Create Administrator
                </Button>
            </div>

            <Modal
                title="Create New Administrator"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateUser}
                    initialValues={{ role: 'pharmacy_admin' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="firstName"
                            label="First Name"
                            rules={[{ required: true, message: 'Please input first name!' }]}
                        >
                            <Input placeholder="First Name" />
                        </Form.Item>
                        <Form.Item
                            name="lastName"
                            label="Last Name"
                            rules={[{ required: true, message: 'Please input last name!' }]}
                        >
                            <Input placeholder="Last Name" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please input email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please input phone number!' }]}
                    >
                        <Input placeholder="09XXXXXXXX" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Temporary Password"
                        rules={[
                            { required: true, message: 'Please input password!' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password placeholder="Min 6 characters" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Account Role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                    >
                        <Select placeholder="Select role">
                            <Option value="pharmacy_admin">Pharmacy Admin</Option>
                            <Option value="system_admin">System Admin</Option>
                        </Select>
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={createLoading}>
                                Create Administrator
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            <Card bordered={false}>
                {/* Filters Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
                    <Space>
                        <Input
                            placeholder="Search users..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onPressEnter={handleSearch}
                        />
                        <Select
                            placeholder="All Roles"
                            style={{ width: 170 }}
                            allowClear
                            value={roleFilter || undefined}
                            onChange={value => setRoleFilter(value || '')}
                        >
                            <Option value="customer">Customer</Option>
                            <Option value="delivery">Delivery</Option>
                            <Option value="pharmacy_owner">Pharmacy Owner</Option>
                            <Option value="pharmacy_admin">Pharmacy Admin</Option>
                            <Option value="pharmacist">Pharmacist</Option>
                            <Option value="technician">Technician</Option>
                            <Option value="assistant">Assistant</Option>
                            <Option value="cashier">Cashier</Option>
                            <Option value="staff">Staff</Option>
                            <Option value="pharmacy_staff">Pharmacy Staff</Option>
                            <Option value="admin">Admin</Option>
                            <Option value="system_admin">System Admin</Option>
                        </Select>
                        <Select
                            placeholder="Status"
                            style={{ width: 120 }}
                            allowClear
                            value={statusFilter || undefined}
                            onChange={value => setStatusFilter(value || '')}
                        >
                            <Option value="active">Active</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="suspended">Suspended</Option>
                            <Option value="rejected">Rejected</Option>
                        </Select>
                    </Space>

                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Space>
                                <Button onClick={() => handleBulkAction('Activate')}>Activate</Button>
                                <Button danger onClick={() => handleBulkAction('Disable')}>Disable</Button>
                            </Space>
                        )}
                        <Button icon={<ExportOutlined />} onClick={handleExportCSV}>Export CSV</Button>
                    </Space>
                </div>

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        ...pagination,
                        onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
                        showSizeChanger: true
                    }}
                />
            </Card >
        </div >
    );
};

export default UsersList;
