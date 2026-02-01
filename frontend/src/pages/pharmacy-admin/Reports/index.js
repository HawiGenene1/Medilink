import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, List, Button, Space, Progress, Statistic, Select, DatePicker, message, Avatar } from 'antd';
import {
    BarChartOutlined, PieChartOutlined, LineChartOutlined, DownloadOutlined,
    FileTextOutlined, GlobalOutlined, ShopOutlined, CheckCircleOutlined,
    CrownOutlined, SolutionOutlined
} from '@ant-design/icons';
import pharmacyAdminService from '../../../services/pharmacyAdminService';
import moment from 'moment';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const { Title, Text } = Typography;

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportType, setReportType] = useState('overview');
    const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);

    useEffect(() => {
        fetchReports();
    }, [reportType, dateRange]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await pharmacyAdminService.generateReports({
                type: 'all', // Always fetch all for the dashboard to keep it populated
                startDate: dateRange[0]?.format('YYYY-MM-DD'),
                endDate: dateRange[1]?.format('YYYY-MM-DD'),
                reportType: reportType // Still send specific type if backend needs to filter list
            });
            setReportData(response.data);
            if (reportType !== 'overview') {
                message.success({ content: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated`, key: 'genReport' });
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            message.error('Failed to generate reports');
        } finally {
            setLoading(false);
        }
    };

    const formatTrendData = (trends) => {
        if (!trends) return [];
        const data = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 11; i >= 0; i--) {
            const d = moment().subtract(i, 'months');
            const monthNum = d.month() + 1;
            const yearNum = d.year();

            const revTrend = trends.revenue?.find(t => t._id.month === monthNum && t._id.year === yearNum);
            const growthTrend = trends.growth?.find(t => t._id.month === monthNum && t._id.year === yearNum);

            data.push({
                name: months[monthNum - 1],
                revenue: revTrend ? revTrend.revenue : 0,
                registrations: growthTrend ? growthTrend.count : 0
            });
        }
        return data;
    };

    const handleGenerateReport = (type) => {
        if (reportType === type) {
            fetchReports();
        } else {
            setReportType(type);
        }
        message.loading({ content: 'Generating report...', key: 'genReport' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExport = () => {
        if (!reportData) return;

        const rows = [
            ['MEDILINK PLATFORM ANALYTICS REPORT'],
            ['Generated At', moment().format('YYYY-MM-DD HH:mm')],
            ['Report Period', `${dateRange[0]?.format('YYYY-MM-DD')} to ${dateRange[1]?.format('YYYY-MM-DD')}`],
            [''],
            ['1. OVERVIEW STATISTICS'],
            ['Metric', 'Value', 'Description'],
            ['Total Pharmacies', reportData.overview?.totalPharmacies || 0, 'Total pharmacies registered on the platform'],
            ['Active Pharmacies', reportData.overview?.activePharmacies || 0, 'Pharmacies currently active and verified'],
            ['Active Subscriptions', reportData.overview?.activeSubscriptions || 0, 'Pharmacies with a current active plan'],
            ['Active Users (30d)', reportData.overview?.activeUsers || 0, 'Unique users who logged in last 30 days'],
            [''],
            ['2. GROWTH & REVENUE TRENDS (Last 12 Months)'],
            ['Month', 'New Registrations', 'Revenue (ETB)'],
            ...formatTrendData(reportData.trends).map(d => [d.name, d.registrations, d.revenue]),
            [''],
            ['3. GEOGRAPHIC DISTRIBUTION'],
            ['City', 'Pharmacy Count', 'Percentage (%)'],
            ...(reportData.geographic || []).map(g => [
                g._id || 'Unknown',
                g.count,
                ((g.count / (reportData.overview?.totalPharmacies || 1)) * 100).toFixed(1) + '%'
            ]),
            [''],
            ['4. REGISTRATION BREAKDOWN'],
            ['Status', 'Count'],
            ...(reportData.registrations || []).map(r => [r._id.toUpperCase(), r.count]),
            [''],
            ['5. SUBSCRIPTION PLAN DISTRIBUTION'],
            ['Plan', 'Total Count', 'Active Count'],
            ...(reportData.subscriptions || []).map(s => [
                s._id.toUpperCase(),
                s.count,
                s.status.filter(st => st === 'active').length
            ]),
            [''],
            ['--- END OF REPORT ---']
        ];

        const csvContent = "\ufeff" + rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Medilink_Advanced_Report_${moment().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success('Report exported in structured format');
    };

    return (
        <div style={{ padding: '24px' }}>
            <div className="welcome-section" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <Title level={2} style={{ marginBottom: '8px' }}>Analytics & Reports</Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>Generate and view system-level performance reports</Text>
                </div>
                <Space size="middle" style={{ marginBottom: '4px' }}>
                    <Select
                        value={reportType}
                        onChange={setReportType}
                        style={{ width: 160 }}
                    >
                        <Select.Option value="overview">Overview Report</Select.Option>
                        <Select.Option value="registrations">Registrations</Select.Option>
                        <Select.Option value="subscriptions">Subscriptions</Select.Option>
                        <Select.Option value="all">Complete Report</Select.Option>
                    </Select>

                    {/* Native Date Selection for better stability and non-formal feel */}
                    <Space direction="horizontal" style={{ background: '#fff', padding: '4px 12px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <input
                            type="date"
                            style={{ border: 'none', outline: 'none', fontSize: '13px' }}
                            value={dateRange[0]?.format('YYYY-MM-DD')}
                            onChange={(e) => setDateRange([moment(e.target.value), dateRange[1]])}
                        />
                        <span style={{ color: '#bfbfbf' }}>→</span>
                        <input
                            type="date"
                            style={{ border: 'none', outline: 'none', fontSize: '13px' }}
                            value={dateRange[1]?.format('YYYY-MM-DD')}
                            onChange={(e) => setDateRange([dateRange[0], moment(e.target.value)])}
                        />
                    </Space>

                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        style={{ borderRadius: '8px' }}
                    >
                        Export
                    </Button>
                </Space>
            </div>

            {/* Stats Banner Mini */}
            {reportData?.overview && (
                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                    <Col span={24}>
                        <div className="stats-banner-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                            <div className="banner-stat">
                                <Text type="secondary" style={{ fontSize: '13px' }}>Total Pharmacies</Text>
                                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{reportData.overview.totalPharmacies}</Title>
                            </div>
                            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                            <div className="banner-stat">
                                <Text type="secondary" style={{ fontSize: '13px' }}>Active</Text>
                                <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{reportData.overview.activePharmacies}</Title>
                            </div>
                            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                            <div className="banner-stat">
                                <Text type="secondary" style={{ fontSize: '13px' }}>Active Subs</Text>
                                <Title level={2} style={{ margin: 0, color: '#722ed1' }}>{reportData.overview.activeSubscriptions}</Title>
                            </div>
                            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                            <div className="banner-stat">
                                <Text type="secondary" style={{ fontSize: '13px' }}>Total Subs</Text>
                                <Title level={2} style={{ margin: 0, color: '#13c2c2' }}>{reportData.overview.totalSubscriptions}</Title>
                            </div>
                            <div className="banner-divider" style={{ width: 1, height: 40, background: '#f0f0f0' }} />
                            <div className="banner-stat">
                                <Text type="secondary" style={{ fontSize: '13px' }}>Active Users</Text>
                                <Title level={2} style={{ margin: 0, color: '#eb2f96' }}>{reportData.overview.activeUsers}</Title>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

            {/* Trends Section */}
            {reportData?.trends && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} lg={12}>
                        <Card title="Monthly Revenue Trends (ETB)" loading={loading}>
                            <div style={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer>
                                    <BarChart data={formatTrendData(reportData.trends)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="revenue" fill="#722ed1" name="Revenue" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Pharmacy Growth Trends" loading={loading}>
                            <div style={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer>
                                    <LineChart data={formatTrendData(reportData.trends)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="registrations" stroke="#1890ff" name="New Registrations" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Geographic & Distribution */}
            {reportData?.geographic && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24}>
                        <Card title="Geographic Pharmacy Distribution" loading={loading}>
                            <Row gutter={16}>
                                <Col xs={24} lg={16}>
                                    <div style={{ height: 350, width: '100%' }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={reportData.geographic}
                                                    dataKey="count"
                                                    nameKey="_id"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {reportData.geographic.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#1890ff', '#722ed1', '#13c2c2', '#52c41a', '#faad14', '#f5222d'][index % 6]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <List
                                        size="small"
                                        dataSource={reportData.geographic}
                                        renderItem={item => (
                                            <List.Item>
                                                <Text>{item._id || 'Unknown'}</Text>
                                                <Text type="secondary">
                                                    {((item.count / (reportData.overview?.totalPharmacies || 1)) * 100).toFixed(1)}% ({item.count})
                                                </Text>
                                            </List.Item>
                                        )}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Registration Report */}
            {reportData?.registrations && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24}>
                        <Card title="Registration Statistics" loading={loading}>
                            <Row gutter={16}>
                                {reportData.registrations.map((stat, index) => (
                                    <Col xs={24} sm={8} key={index}>
                                        <Statistic
                                            title={`${stat._id.charAt(0).toUpperCase() + stat._id.slice(1)} Registrations`}
                                            value={stat.count}
                                            valueStyle={{
                                                color: stat._id === 'approved' ? '#52c41a' :
                                                    stat._id === 'pending' ? '#faad14' : '#f5222d'
                                            }}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Subscription Report */}
            {reportData?.subscriptions && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24}>
                        <Card title="Subscription Plan Distribution" loading={loading}>
                            <Row gutter={16}>
                                {reportData.subscriptions.map((stat, index) => (
                                    <Col xs={24} sm={8} key={index}>
                                        <Statistic
                                            title={`${stat._id.charAt(0).toUpperCase() + stat._id.slice(1)} Plan`}
                                            value={stat.count}
                                            valueStyle={{ color: '#722ed1' }}
                                        />
                                        <Text type="secondary">
                                            Active: {stat.status.filter(s => s === 'active').length}
                                        </Text>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Available Reports List */}
            <Title level={4} style={{ marginTop: '32px' }}>Quick Report Templates</Title>
            <List
                style={{ background: '#fff' }}
                bordered
                dataSource={[
                    { title: 'Monthly Pharmacy Growth Report', type: 'trends', icon: <LineChartOutlined /> },
                    { title: 'Subscription Revenue Details', type: 'subscriptions', icon: <PieChartOutlined /> },
                    { title: 'Registration Statistics', type: 'registrations', icon: <BarChartOutlined /> },
                    { title: 'Complete Platform Report', type: 'all', icon: <FileTextOutlined /> }
                ]}
                renderItem={item => (
                    <List.Item
                        actions={[<Button type="link" onClick={() => handleGenerateReport(item.type)}>Generate</Button>]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar icon={item.icon} style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }} />}
                            title={item.title}
                        />
                    </List.Item>
                )}
            />
        </div >
    );
};

export default Reports;
