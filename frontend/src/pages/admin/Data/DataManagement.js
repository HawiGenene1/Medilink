
import React from 'react';
import { Row, Col, Card, Button, Table, Tag, Space, Typography, Upload, Alert } from 'antd';
import {
    CloudDownloadOutlined,
    CloudUploadOutlined,
    HistoryOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    DatabaseOutlined,
    ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DataManagement = () => {

    const backups = [
        { key: 1, date: '2024-01-20 02:00 AM', type: 'Automated', size: '450 MB', status: 'Success' },
        { key: 2, date: '2024-01-19 02:00 AM', type: 'Automated', size: '448 MB', status: 'Success' },
        { key: 3, date: '2024-01-18 14:30 PM', type: 'Manual', size: '445 MB', status: 'Success' },
        { key: 4, date: '2024-01-17 02:00 AM', type: 'Automated', size: '0 MB', status: 'Failed' },
    ];

    const columns = [
        { title: 'Backup Date', dataIndex: 'date', key: 'date' },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Size', dataIndex: 'size', key: 'size' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => <Tag color={status === 'Success' ? 'success' : 'error'}>{status}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<CloudDownloadOutlined />}>Download</Button>
                    <Button size="small" icon={<ReloadOutlined />}>Restore</Button>
                </Space>
            )
        }
    ];

    return (
        <div className="data-management-page">
            <Title level={2}>Data Management</Title>

            <Alert
                message="Data Retention Policy"
                description="Automated backups are retained for 30 days. Manual exports contain sensitive PII and should be handled securely."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title={<span><HistoryOutlined /> System Backups</span>} extra={<Button type="primary" icon={<DatabaseOutlined />}>Trigger Backup Now</Button>}>
                        <Table
                            columns={columns}
                            dataSource={backups}
                            pagination={false}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Data Exports" style={{ marginBottom: 24 }}>
                        <Text strong>Select Data Source</Text>
                        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                            <Button block icon={<FileExcelOutlined />}>Export All Users (CSV)</Button>
                            <Button block icon={<FileExcelOutlined />}>Export Pharmacy Registry (CSV)</Button>
                            <Button block icon={<FilePdfOutlined />}>Download Audit Report (PDF)</Button>
                        </Space>
                    </Card>

                    <Card title="Data Import / Restore">
                        <Upload.Dragger>
                            <p className="ant-upload-drag-icon">
                                <CloudUploadOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag backup file to this area to restore</p>
                            <p className="ant-upload-hint">
                                Support for .sql or .zip backup files only.
                            </p>
                        </Upload.Dragger>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DataManagement;
