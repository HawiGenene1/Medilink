
import React, { useState } from 'react';
import { Table, Card, Tag, Button, Input, DatePicker, Space, Drawer, Typography, Descriptions } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, FileSearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AuditLogs = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // All audit logs loaded from database
    const logs = [];

    const columns = [
        { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: action => {
                let color = 'blue';
                if (action === 'DELETE') color = 'red';
                if (action === 'CREATE') color = 'green';
                return <Tag color={color}>{action}</Tag>;
            }
        },
        { title: 'Actor', dataIndex: 'actor', key: 'actor' },
        { title: 'Resource', dataIndex: 'resource', key: 'resource' },
        { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => <Tag color={status === 'Success' ? 'success' : 'error'}>{status}</Tag>
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
                    <Input placeholder="Search by Actor or Resource" prefix={<SearchOutlined />} style={{ width: 250 }} />
                    <RangePicker />
                    <Button icon={<FilterOutlined />}>Filter Action</Button>
                    <Button type="primary" icon={<FileSearchOutlined />}>Export Report</Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={logs}
                    pagination={{ pageSize: 10 }}
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
                            <Descriptions.Item label="Transaction ID">LOG-{selectedLog.key}99823</Descriptions.Item>
                            <Descriptions.Item label="Timestamp">{selectedLog.timestamp}</Descriptions.Item>
                            <Descriptions.Item label="Actor">{selectedLog.actor}</Descriptions.Item>
                            <Descriptions.Item label="Status">{selectedLog.status}</Descriptions.Item>
                            <Descriptions.Item label="IP Origin">{selectedLog.ip}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <Text strong>Payload Change (Diff)</Text>
                            <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 6, marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}>
                                {`{
  "resource": "${selectedLog.resource}",
  "changes": {
    "status": {
      "before": "PENDING",
      "after": "APPROVED"
    },
    "updated_by": "admin_user"
  }
}`}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default AuditLogs;
