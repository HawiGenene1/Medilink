import React from 'react';
import { Card } from 'antd';
import ForgotPasswordForm from '../../../components/auth/ForgotPassword';

const ForgotPassword = () => {
  const handleSubmit = (values) => {
    console.log('Forgot Password:', values);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Forgot Password">
        <ForgotPasswordForm onSubmit={handleSubmit} />
      </Card>
    </div>
  );
};

export default ForgotPassword;
