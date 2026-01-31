import React from 'react';
import { Result, Button, Card } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const OwnerPlaceholder = ({ title, subTitle }) => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '24px' }}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Result
                    icon={<SmileOutlined />}
                    title={title || "Coming Soon!"}
                    subTitle={subTitle || "We're currently working on this feature. Stay tuned!"}
                    extra={
                        <Button type="primary" onClick={() => navigate('/owner/dashboard')}>
                            Back to Dashboard
                        </Button>
                    }
                />
            </Card>
        </div>
    );
};

export default OwnerPlaceholder;
