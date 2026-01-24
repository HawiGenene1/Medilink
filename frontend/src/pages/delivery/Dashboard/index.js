
import React from 'react';
import { Card, Button, Typography, Result, List, Tag, Row, Col, Avatar, Space, Divider } from 'antd';
import {
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  RightOutlined,
  CompassOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const tasks = [
    {
      id: '882',
      customer: 'Abebe Bikila',
      address: 'Bole, near Edna Mall',
      status: 'Assigned',
      distance: '0.8 km',
      eta: '5-8 mins',
      pharmacy: 'Kenema Pharmacy'
    },
    {
      id: '889',
      customer: 'Sara Tsegaye',
      address: 'Kazanchis, Traffic Light',
      status: 'In Progress',
      distance: '2.4 km',
      eta: '15 mins',
      pharmacy: 'Zebidar Pharmacy'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>Delivery Portal</Title>
        <Text type="secondary">Manage your clinical delivery assignments.</Text>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>Current Assignments</Title>
        <List
          dataSource={tasks}
          renderItem={item => (
            <Card
              hoverable
              style={{ marginBottom: '16px', borderRadius: '16px', border: '1px solid #eef2f6' }}
              bodyStyle={{ padding: '20px' }}
              onClick={() => navigate(`/delivery/details/${item.id}`)}
            >
              <Row align="middle" gutter={16}>
                <Col flex="60px">
                  <Avatar size={54} icon={<CarOutlined />} style={{ background: '#E3F2FD', color: '#1E88E5' }} />
                </Col>
                <Col flex="auto">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text strong style={{ fontSize: '16px' }}>Delivery #{item.id}</Text>
                      <br />
                      <Text type="secondary">{item.customer}</Text>
                    </div>
                    <Tag color={item.status === 'Assigned' ? 'blue' : 'processing'} style={{ borderRadius: '12px', margin: 0 }}>
                      {item.status}
                    </Tag>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      <EnvironmentOutlined /> {item.distance}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      <ClockCircleOutlined /> {item.eta}
                    </Text>
                  </div>
                </Col>
                <Col>
                  <Button type="text" icon={<RightOutlined />} />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Pickup: {item.pharmacy}</Text>
                <Button type="primary" size="small" icon={<CompassOutlined />} style={{ borderRadius: '8px' }}>
                  Navigate
                </Button>
              </div>
            </Card>
          )}
        />
      </div>

      <Card
        style={{ borderRadius: '16px', background: '#f8fafc', border: 'none' }}
        bodyStyle={{ textAlign: 'center' }}
      >
        <Result
          status="info"
          title="Ready for more tasks?"
          subTitle="You are currently online and visible to pharmacies in Bole area."
          extra={<Button type="default" disabled>Go Offline</Button>}
        />
      </Card>
    </div>
  );
};

export default DeliveryDashboard;
