import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Input, DatePicker, Space, Drawer, Typography, Descriptions, message } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, FileSearchOutlined } from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AuditLogs = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                action: search || undefined
            };
            const response = await api.get('/admin/audit-logs', { params });
            if (response.data.success) {
                setLogs(response.data.data.logs);
                setPagination(prev => ({ ...prev, total: response.data.data.pagination.total }));
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            message.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [pagination.current, pagination.pageSize]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchLogs();
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'timestamp',
            width: 180,
            render: date => new Date(date).toLocaleString()
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: action => {
                let color = 'blue';
                if (action?.includes('DELETE')) color = 'red';
                if (action?.includes('CREATE')) color = 'green';
                if (action?.includes('FAILED')) color = 'orange';
                return <Tag color={color}>{action}</Tag>;
            }
        },
        {
            title: 'Actor',
            dataIndex: 'user',
            key: 'actor',
            render: user => user ? `${user.name || user.email}` : 'System'
        },
        { title: 'Resource', dataIndex: 'entityType', key: 'resource' },
        { title: 'IP Address', dataIndex: 'ipAddress', key: 'ip' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => <Tag color={status === 'SUCCESS' ? 'success' : 'error'}>{status}</Tag>
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
        <div className="audit-logs-page">
            <Title level={2}>System Audit Logs</Title>

            <Card bordered={false}>
                <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Input
                        placeholder="Search by Action (e.g. LOGIN)"
                        prefix={<SearchOutlined />}
                        style={{ width: 250 }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <RangePicker />
                    <Button icon={<FilterOutlined />} onClick={handleSearch}>Apply Filters</Button>
                    <Button type="primary" icon={<FileSearchOutlined />}>Export Report</Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={logs}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
                    }}
                    rowKey="_id"
                    size="middle"
                />
            </Card>

            <Drawer
                title="Log Detail Inspection"
                placement="right"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                width={500}
            >
                {selectedLog && (
                    <div className="log-detail-content">
                        <Descriptions title="Transaction Meta" bordered column={1} size="small">
                            <Descriptions.Item label="Transaction ID">LOG-{selectedLog._id?.substring(selectedLog._id.length - 6).toUpperCase()}</Descriptions.Item>
                            <Descriptions.Item label="Timestamp">{new Date(selectedLog.createdAt).toLocaleString()}</Descriptions.Item>
                            <Descriptions.Item label="Actor">{selectedLog.user?.name || selectedLog.user?.email || 'System'}</Descriptions.Item>
                            <Descriptions.Item label="Status">{selectedLog.status}</Descriptions.Item>
                            <Descriptions.Item label="IP Origin">{selectedLog.ipAddress}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <Text strong>Payload Change (Diff)</Text>
                            <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 6, marginTop: 8, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
                                {JSON.stringify({
                                    entityType: selectedLog.entityType,
                                    entityId: selectedLog.entityId,
                                    description: selectedLog.description,
                                    details: selectedLog.details
                                }, null, 2)}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default AuditLogs;
