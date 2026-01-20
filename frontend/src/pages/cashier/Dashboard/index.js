
import React from 'react';
import { Card, Button, Typography, Result } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';

const CashierDashboard = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Typography.Title level={2}>Cashier Station</Typography.Title>
      <Card>
        <Result
          icon={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
          title="Point of Sale Interface"
          subTitle="Manage payments and walk-in sales here."
          extra={[
            <Button type="primary" key="console" size="large">
              New Transaction
            </Button>,
            <Button key="buy" size="large">View History</Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default CashierDashboard;
