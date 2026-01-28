
import React, { useState } from 'react';
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

const { Option } = Select;
const { Title } = Typography;

const UsersList = () => {
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock Data
    const dataSource = Array.from({ length: 46 }).map((_, i) => ({
        key: i,
        name: `User ${i}`,
        email: `user${i}@medilink.com`,
        role: i % 3 === 0 ? 'Admin' : (i % 2 === 0 ? 'Pharmacy Owner' : 'Customer'),
        status: i % 10 === 0 ? 'Disabled' : 'Active',
        lastLogin: '2 mins ago',
        location: 'Addis Ababa'
    }));

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {text.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{record.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            filters: [
                { text: 'Admin', value: 'Admin' },
                { text: 'Pharmacy Owner', value: 'Pharmacy Owner' },
                { text: 'Customer', value: 'Customer' },
            ],
            onFilter: (value, record) => record.role === value,
            render: role => {
                let color = 'blue';
                if (role === 'Admin') color = 'purple';
                if (role === 'Pharmacy Owner') color = 'green';
                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'Active' ? 'success' : 'error'} icon={status === 'Active' ? <CheckCircleOutlined /> : <StopOutlined />}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLogin',
            key: 'lastLogin',
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record.key}`)}>View</Button>
                    </Tooltip>
                    <Dropdown
                        menu={{
                            items: [
                                { key: 'edit', label: 'Edit Role', icon: <EditOutlined /> },
                                { key: 'disable', label: 'Disable Account', icon: <StopOutlined />, danger: true },
                            ]
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                </Space>
            ),
        },
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
                        <Input placeholder="Search users..." prefix={<SearchOutlined />} style={{ width: 250 }} />
                        <Select placeholder="Filter by Status" style={{ width: 150 }} allowClear>
                            <Option value="active">Active</Option>
                            <Option value="disabled">Disabled</Option>
                        </Select>
                        <Button icon={<FilterOutlined />}>More Filters</Button>
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
                    dataSource={dataSource}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>
        </div>
    );
};

export default UsersList;
