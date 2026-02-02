import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Button, Input, DatePicker, Space, Drawer, Typography, Descriptions, message, Select, Badge } from 'antd';
import { SearchOutlined, EyeOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
import adminService from '../../../services/api/admin';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AuditLogs = () => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [actionFilter, setActionFilter] = useState('all');
    const [entityFilter, setEntityFilter] = useState('all');

    const fetchLogs = useCallback(async (page = 1, currentFilters = {}) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.pageSize,
                ...currentFilters
            };

            // Apply state filters if not explicitly provided
            if (!currentFilters.search && search) params.search = search;
            if (!currentFilters.action && actionFilter !== 'all') params.action = actionFilter;
            if (!currentFilters.entityType && entityFilter !== 'all') params.entityType = entityFilter;
            if (!currentFilters.startDate && dateRange?.[0]) params.startDate = dateRange[0].toISOString();
            if (!currentFilters.endDate && dateRange?.[1]) params.endDate = dateRange[1].toISOString();

            const response = await adminService.getAuditLogs(params);
            if (response.success) {
                setLogs(response.data);
                setPagination(prev => ({
                    ...prev,
                    current: response.currentPage,
                    total: response.count
                }));
            }
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [pagination.pageSize, search, actionFilter, entityFilter, dateRange]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleTableChange = (newPagination) => {
        fetchLogs(newPagination.current);
    };

    const handleSearch = (value) => {
        setSearch(value);
        fetchLogs(1, { search: value });
    };

    const handleDateChange = (dates) => {
        setDateRange(dates);
        const filters = {};
        if (dates) {
            filters.startDate = dates[0].toISOString();
            filters.endDate = dates[1].toISOString();
        }
        fetchLogs(1, filters);
    };

    const handleExport = async () => {
        try {
            const filters = {};
            if (search) filters.search = search;
            if (actionFilter !== 'all') filters.action = actionFilter;
            if (dateRange) {
                filters.startDate = dateRange[0].toISOString();
                filters.endDate = dateRange[1].toISOString();
            }

            const response = await adminService.exportData('audit_logs', 'csv', filters);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Export error:', error);
            message.error('Failed to export logs');
        }
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: date => new Date(date).toLocaleString()
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: action => {
                let color = 'blue';
                if (action === 'DELETE' || action === 'REJECT') color = 'red';
                if (action === 'CREATE' || action === 'APPROVE') color = 'green';
                if (action === 'UPDATE') color = 'orange';
                return <Tag color={color}>{action}</Tag>;
            }
        },
        {
            title: 'Actor',
            dataIndex: 'userEmail',
            key: 'userEmail',
            render: (email, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.user?.firstName} {record.user?.lastName}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{email}</Text>
                </Space>
            )
        },
        {
            title: 'Entity',
            dataIndex: 'entityType',
            key: 'entityType',
            render: type => <Tag color="purple">{type}</Tag>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Badge
                    status={status === 'SUCCESS' ? 'success' : 'error'}
                    text={status}
                />
            )
        },
        {
            title: 'Details',
            key: 'details',
            render: (_, record) => (
                <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedLog(record);
                        setDrawerOpen(true);
                    }}
                >
                    Inspect
                </Button>
            )
        }
    ];

    return (
        <div className="audit-logs-page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>System Audit Logs</Title>
                    <Text type="secondary">Monitor administrative actions and system events</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchLogs(pagination.current)}>Refresh</Button>
                    <Button type="primary" icon={<FileSearchOutlined />} onClick={handleExport}>Export Report</Button>
                </Space>
            </div>

            <Card bordered={false} className="premium-card">
                <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Input.Search
                        placeholder="Search actor or description..."
                        onSearch={handleSearch}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <RangePicker
                        onChange={handleDateChange}
                    />
                    <Select
                        defaultValue="all"
                        style={{ width: 140 }}
                        onChange={val => { setActionFilter(val); fetchLogs(1, { action: val !== 'all' ? val : undefined }); }}
                    >
                        <Option value="all">All Actions</Option>
                        <Option value="CREATE">CREATE</Option>
                        <Option value="UPDATE">UPDATE</Option>
                        <Option value="DELETE">DELETE</Option>
                        <Option value="APPROVE">APPROVE</Option>
                        <Option value="REJECT">REJECT</Option>
                        <Option value="LOGIN">LOGIN</Option>
                    </Select>
                    <Select
                        defaultValue="all"
                        style={{ width: 140 }}
                        onChange={val => { setEntityFilter(val); fetchLogs(1, { entityType: val !== 'all' ? val : undefined }); }}
                    >
                        <Option value="all">All Entities</Option>
                        <Option value="USER">USER</Option>
                        <Option value="PHARMACY">PHARMACY</Option>
                        <Option value="ORDER">ORDER</Option>
                        <Option value="SYSTEM">SYSTEM</Option>
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} logs`
                    }}
                    onChange={handleTableChange}
                    size="middle"
                />
            </Card>

            <Drawer
                title="Log Detail Inspection"
                placement="right"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                width={600}
            >
                {selectedLog && (
                    <div className="log-detail-content">
                        <Descriptions title="Transaction Meta" bordered column={1} size="small">
                            <Descriptions.Item label="Log ID">{selectedLog._id}</Descriptions.Item>
                            <Descriptions.Item label="Timestamp">{new Date(selectedLog.createdAt).toLocaleString()}</Descriptions.Item>
                            <Descriptions.Item label="Actor">{selectedLog.user?.firstName} {selectedLog.user?.lastName} ({selectedLog.userEmail})</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={selectedLog.status === 'SUCCESS' ? 'success' : 'error'}>{selectedLog.status}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="IP Origin">{selectedLog.ipAddress}</Descriptions.Item>
                            <Descriptions.Item label="Action">{selectedLog.action}</Descriptions.Item>
                            <Descriptions.Item label="Entity Type">{selectedLog.entityType}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <Text strong>Activity Description</Text>
                            <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                                {selectedLog.description}
                            </Card>
                        </div>

                        {selectedLog.changes && (
                            <div style={{ marginTop: 24 }}>
                                <Text strong>Data Changes</Text>
                                <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, marginTop: 8, fontFamily: 'monospace', fontSize: 13, overflow: 'auto' }}>
                                    <pre style={{ margin: 0 }}>
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                            <div style={{ marginTop: 24 }}>
                                <Text strong>Additional Metadata</Text>
                                <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 8, marginTop: 8, fontSize: 13 }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default AuditLogs;
