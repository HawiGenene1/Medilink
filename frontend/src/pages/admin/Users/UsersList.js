import React, { useState, useEffect } from 'react';
import {
    Table, Card, Button, Input, Select, Tag,
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
    EditOutlined
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
    const [statusFilter, setStatusFilter] = useState('active');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

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

    const columns = [
        {
            title: 'Name',
            dataIndex: 'firstName',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                        {record.firstName.charAt(0)}{record.lastName.charAt(0)}
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
                if (role === 'pharmacy_admin') {
                    color = 'green';
                    label = 'PHARMACY OWNER';
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
                const isActive = record.isActive;
                return (
                    <Tag
                        color={isActive ? 'success' : 'error'}
                        icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                    >
                        {isActive ? 'ACTIVE' : 'DISABLED'}
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
                                { key: 'disable', label: record.isActive ? 'Disable Account' : 'Enable Account', icon: <StopOutlined />, danger: record.isActive },
                            ]
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </Space>
            ),
        }
    ];

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleBulkAction = (action) => {
        message.success(`${action} applied to ${selectedRowKeys.length} users`);
        setSelectedRowKeys([]);
    };

    return (
        <div className="users-list-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2}>User Management</Title>
                <Button type="primary" icon={<UserAddOutlined />}>Create User</Button>
            </div>

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
                            style={{ width: 150 }}
                            allowClear
                            value={roleFilter || undefined}
                            onChange={value => setRoleFilter(value || '')}
                        >
                            <Option value="customer">Customer</Option>
                            <Option value="delivery">Delivery</Option>
                            <Option value="pharmacy_admin">Pharmacy Owner</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                        <Select
                            placeholder="Filter by Status"
                            style={{ width: 150 }}
                            allowClear
                            value={statusFilter || undefined}
                            onChange={value => setStatusFilter(value || '')}
                        >
                            <Option value="active">Active</Option>
                            <Option value="inactive">Disabled</Option>
                        </Select>
                        <Button type="primary" onClick={handleSearch}>Apply</Button>
                    </Space>

                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Space>
                                <Button onClick={() => handleBulkAction('Activate')}>Activate</Button>
                                <Button danger onClick={() => handleBulkAction('Disable')}>Disable</Button>
                            </Space>
                        )}
                        <Button icon={<ExportOutlined />}>Export CSV</Button>
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
            </Card>
        </div>
    );
};

export default UsersList;
