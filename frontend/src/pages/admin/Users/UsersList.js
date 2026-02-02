import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Card, Button, Input, Select, Tag,
    Space, Tooltip, Dropdown, Modal, message, Typography, Avatar, Form
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
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../../../services/api/admin';

const { Option } = Select;
const { Title, Text } = Typography;

const UsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const [filters, setFilters] = useState({
        role: undefined,
        status: undefined,
        search: ''
    });

    const fetchUsers = useCallback(async (page = 1, pageSize = 10, currentFilters = filters) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pageSize,
                role: currentFilters.role,
                status: currentFilters.status,
                search: currentFilters.search
            };
            const response = await adminService.getAllUsers(params);
            if (response.success) {
                setUsers(response.data.map(u => ({
                    ...u,
                    key: u._id,
                    name: `${u.firstName} ${u.lastName}`,
                    lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
                    location: u.city || 'N/A'
                })));
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.count
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleTableChange = (newPagination, tableFilters, sorter) => {
        fetchUsers(newPagination.current, newPagination.pageSize);
    };

    const handleFilterChange = (value, type) => {
        const newFilters = { ...filters, [type]: value };
        setFilters(newFilters);
        fetchUsers(1, pagination.pageSize, newFilters);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        // Debounce search in real apps, for now simple:
        if (value.length > 2 || value.length === 0) {
            fetchUsers(1, pagination.pageSize, newFilters);
        }
    };

    const handleCreateUser = async (values) => {
        try {
            setCreating(true);
            const response = await adminService.createAdminUser(values);
            if (response.success) {
                message.success('User created successfully');
                setIsModalVisible(false);
                form.resetFields();
                fetchUsers(1, pagination.pageSize); // Refresh list
            } else {
                message.error(response.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Create user error:', error);
            message.error('An error occurred while creating user');
        } finally {
            setCreating(false);
        }
    };

    const handleExport = async () => {
        try {
            const exportFilters = {};
            if (filters.role) exportFilters.role = filters.role;
            if (filters.status) {
                // Map status to boolean
                if (filters.status === 'active') exportFilters.isActive = true;
                if (filters.status === 'inactive') exportFilters.isActive = false;
            }

            const response = await adminService.exportData('users', 'csv', exportFilters);

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Export error:', error);
            message.error('Failed to export data');
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.profileImage} style={{ backgroundColor: '#1E88E5' }}>
                        {record.firstName?.charAt(0)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: role => {
                const colors = {
                    admin: 'purple',
                    pharmacy_admin: 'green',
                    cashier: 'blue',
                    delivery: 'orange',
                    customer: 'cyan'
                };
                return <Tag color={colors[role] || 'default'}>{role?.replace('_', ' ').toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: isActive => (
                <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
                    {isActive ? 'Active' : 'Disabled'}
                </Tag>
            )
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleDateString()
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLogin',
            key: 'lastLogin',
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
                                { key: 'status', label: record.isActive ? 'Disable' : 'Enable', icon: <StopOutlined />, danger: record.isActive },
                            ]
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };

    return (
        <div className="users-list-page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>User Directory</Title>
                    <Text type="secondary">Manage platform accounts and permissions</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(pagination.current)}>Refresh</Button>
                    <Button type="primary" icon={<UserAddOutlined />} className="premium-btn" onClick={() => setIsModalVisible(true)}>Create User</Button>
                </Space>
            </div>

            <Modal
                title="Create New User"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateUser}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="firstName"
                            label="First Name"
                            rules={[{ required: true, message: 'Please enter first name' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="John" />
                        </Form.Item>
                        <Form.Item
                            name="lastName"
                            label="Last Name"
                            rules={[{ required: true, message: 'Please enter last name' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Doe" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="john@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password placeholder="******" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select placeholder="Select a role">
                            <Option value="admin">System Admin</Option>
                            <Option value="pharmacy_admin">Pharmacy Admin</Option>
                            <Option value="cashier">Cashier</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={creating}>
                                Create User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Card bordered={false} className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                    <Space size="middle">
                        <Input
                            placeholder="Name, email, or phone..."
                            prefix={<SearchOutlined />}
                            style={{ width: 300 }}
                            onChange={handleSearch}
                            allowClear
                        />
                        <Select
                            placeholder="All Roles"
                            style={{ width: 160 }}
                            allowClear
                            onChange={(v) => handleFilterChange(v, 'role')}
                        >
                            <Option value="admin">System Admin</Option>
                            <Option value="pharmacy_admin">Pharmacy Admin</Option>
                            <Option value="cashier">Cashier</Option>
                            <Option value="delivery">Delivery</Option>
                            <Option value="customer">Customer</Option>
                        </Select>
                        <Select
                            placeholder="Status"
                            style={{ width: 120 }}
                            allowClear
                            onChange={(v) => handleFilterChange(v, 'status')}
                        >
                            <Option value="active">Active</Option>
                            <Option value="inactive">Disabled</Option>
                        </Select>
                    </Space>

                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Space>
                                <Button>Activate</Button>
                                <Button danger>Disable</Button>
                            </Space>
                        )}
                        <Button icon={<ExportOutlined />} onClick={handleExport}>Export</Button>
                    </Space>
                </div>

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} users`
                    }}
                    onChange={handleTableChange}
                    className="medilink-table"
                />
            </Card>
        </div>
    );
};

export default UsersList;
