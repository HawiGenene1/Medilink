import React from 'react';
import { Card } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesChart = ({ data = [], type = 'line', title = 'Sales Overview' }) => {
    // Sample data structure for demo
    const sampleData = data.length > 0 ? data : [
        { name: 'Mon', sales: 4000, refunds: 240 },
        { name: 'Tue', sales: 3000, refunds: 139 },
        { name: 'Wed', sales: 2000, refunds: 980 },
        { name: 'Thu', sales: 2780, refunds: 390 },
        { name: 'Fri', sales: 1890, refunds: 480 },
        { name: 'Sat', sales: 2390, refunds: 380 },
        { name: 'Sun', sales: 3490, refunds: 430 },
    ];

    const renderChart = () => {
        if (type === 'bar') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#1890ff" />
                        <Bar dataKey="refunds" fill="#ff4d4f" />
                    </BarChart>
                </ResponsiveContainer>
            );
        } else if (type === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={sampleData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="sales"
                        >
                            {sampleData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            );
        } else {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sampleData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#1890ff" strokeWidth={2} />
                        <Line type="monotone" dataKey="refunds" stroke="#ff4d4f" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
    };

    return (
        <Card title={title} style={{ height: '100%' }}>
            {renderChart()}
        </Card>
    );
};

export default SalesChart;
