import React from 'react';
import api from '../../../services/api';
import { Row, Col, Card, Button, Table, Tag, Space, Typography, Upload, message, Alert } from 'antd';
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

    const [loading, setLoading] = React.useState(false);
    const [backups, setBackups] = React.useState([]);

    const fetchBackups = async () => {
        try {
            const res = await api.get('/admin/data/backups');
            if (res.data.success) {
                setBackups(res.data.data.map(b => ({
                    key: b._id,
                    date: new Date(b.createdAt).toLocaleString(),
                    type: b.type === 'manual' ? 'Manual Export' : 'Automated',
                    size: (b.size / 1024).toFixed(2) + ' KB',
                    status: b.status === 'success' ? 'Success' : 'Failed'
                })));
            }
        } catch (error) {
            console.error('Failed to fetch backups');
        }
    };

    React.useEffect(() => {
        fetchBackups();
    }, []);

    const handleTriggerBackup = async () => {
        try {
            setLoading(true);
            const res = await api.post('/admin/data/backup/trigger');
            if (res.data.success) {
                message.success('System backup initiated successfully');
                fetchBackups();
            }
        } catch (error) {
            message.error('Failed to trigger backup');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            setLoading(true);
            const response = await api.post('/admin/data/export',
                { type, format: 'csv' },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success(`${type} exported successfully`);
            fetchBackups();
        } catch (error) {
            message.error(`Failed to export ${type}`);
        } finally {
            setLoading(false);
        }
    };

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
                    <Card
                        title={<span><HistoryOutlined /> System Backups</span>}
                        extra={<Button type="primary" icon={<DatabaseOutlined />} loading={loading} onClick={handleTriggerBackup}>Trigger Backup Now</Button>}
                        style={{ height: '100%' }}
                    >
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
                            <Button block icon={<FileExcelOutlined />} loading={loading} onClick={() => handleExport('users')}>Export All Users (CSV)</Button>
                            <Button block icon={<FileExcelOutlined />} loading={loading} onClick={() => handleExport('pharmacies')}>Export Pharmacy Registry (CSV)</Button>
                            <Button block icon={<FilePdfOutlined />} loading={loading} onClick={() => message.info('Generating PDF Report...')}>Download Audit Report (PDF)</Button>
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
