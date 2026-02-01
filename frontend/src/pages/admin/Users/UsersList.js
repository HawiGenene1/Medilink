import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Card, Button, Input, Select, Tag,
    Space, Tooltip, Dropdown, Modal, message, Typography, Avatar
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
                    <Button type="primary" icon={<UserAddOutlined />} className="premium-btn">Create User</Button>
                </Space>
            </div>

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
                        <Button icon={<ExportOutlined />}>Export</Button>
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
