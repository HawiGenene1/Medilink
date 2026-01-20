
import React from 'react';
import { Card, Button, Typography, Result, List, Tag } from 'antd';
import { CarOutlined } from '@ant-design/icons';

const DeliveryDashboard = () => {
  const tasks = [
    { id: 'DEL-882', address: 'Bole, near Edna Mall', status: 'Assigned' },
    { id: 'DEL-889', address: 'Kazanchis, Traffic Light', status: 'In Progress' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Typography.Title level={2}>Delivery Portal</Typography.Title>

      <Card title="Current Assignments" style={{ marginBottom: '24px' }}>
        <List
          dataSource={tasks}
          renderItem={item => (
            <List.Item
              actions={[<Button type="primary">Update Status</Button>]}
            >
              <List.Item.Meta
                avatar={<CarOutlined style={{ fontSize: '24px' }} />}
                title={`Delivery #${item.id}`}
                description={item.address}
              />
              <Tag color="blue">{item.status}</Tag>
            </List.Item>
          )}
        />
      </Card>

      <Card>
        <Result
          status="info"
          title="Ready for more tasks?"
          subTitle="You are currently online and visible to pharmacies."
        />
      </Card>
    </div>
  );
};

export default DeliveryDashboard;
