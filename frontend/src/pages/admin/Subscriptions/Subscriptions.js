import React from 'react';
import { Result, Button, Card } from 'antd';
import { DollarOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Subscriptions = () => {
    const navigate = useNavigate();

    return (
        <div className="subscriptions-page fade-in" style={{ padding: '40px' }}>
            <Card bordered={false} className="premium-card" style={{ textAlign: 'center', borderRadius: '15px' }}>
                <Result
                    icon={<DollarOutlined style={{ fontSize: '72px', color: '#4361ee' }} />}
                    title="Subscription Management"
                    subTitle="This feature is currently under development and will be available soon."
                    extra={[
                        <Button
                            type="primary"
                            key="dashboard"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/admin/dashboard')}
                            size="large"
                            style={{ borderRadius: '8px' }}
                        >
                            Back to Dashboard
                        </Button>
                    ]}
                />
            </Card>
        </div>
    );
};

export default Subscriptions;
