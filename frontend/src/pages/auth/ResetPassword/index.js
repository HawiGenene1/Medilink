import React from 'react';
import { Card } from 'antd';
import ResetPasswordForm from '../../../components/auth/ResetPassword';

const ResetPassword = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card title="Reset Password" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <ResetPasswordForm />
            </Card>
        </div>
    );
};

export default ResetPassword;
