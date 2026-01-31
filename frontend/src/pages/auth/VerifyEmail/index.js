import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Result, Button, Spin, message } from 'antd';
import api from '../../../services/api';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const hasRun = React.useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (!token || hasRun.current) {
                return;
            }

            hasRun.current = true;
            try {
                const response = await api.get(`/auth/verify-email/${token}`);
                if (response.data.success) {
                    setStatus('success');
                    message.success('Account activated successfully!');
                } else {
                    setStatus('error');
                    setErrorMsg(response.data.message || 'Verification failed.');
                }
            } catch (error) {
                console.error('Verification error:', error);

                // If it's a 400 error, it's likely already verified or invalid
                // Since this component is the only one clearing the token, 
                // a fail after a potential success might mean it worked.
                // But for now, let's just show the error as it is.
                setStatus('error');
                setErrorMsg(error.response?.data?.message || 'An error occurred during verification. The link may be expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="verify-email-container">
            {status === 'verifying' && (
                <div className="verify-status">
                    <Spin size="large" tip="Activating your account...">
                        <div style={{ padding: 20 }} />
                    </Spin>
                </div>
            )}

            {status === 'success' && (
                <Result
                    status="success"
                    title="Account Activated!"
                    subTitle="Your email has been verified successfully. You can now log in using the password sent to your email."
                    extra={[
                        <Button type="primary" key="login" onClick={() => navigate('/auth/login')}>
                            Go to Login
                        </Button>
                    ]}
                />
            )}

            {status === 'error' && (
                <Result
                    status="error"
                    title="Activation Failed"
                    subTitle={errorMsg}
                    extra={[
                        <Button type="primary" key="home" onClick={() => navigate('/')}>
                            Back to Home
                        </Button>,
                        <Link key="login" to="/auth/login" style={{ marginLeft: 16 }}>
                            Try Login
                        </Link>
                    ]}
                />
            )}
        </div>
    );
};

export default VerifyEmail;
