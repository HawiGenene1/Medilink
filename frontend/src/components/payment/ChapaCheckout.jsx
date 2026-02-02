import React, { useEffect, useRef } from 'react';
import { Card, Typography, Spin, Alert } from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

/**
 * Chapa HTML Checkout Component
 * Automatically submits a form to redirect to Chapa's hosted payment page
 */
const ChapaCheckout = ({
    publicKey,
    txRef,
    amount,
    currency = 'ETB',
    email,
    firstName,
    lastName,
    title,
    description,
    logo,
    callbackUrl,
    returnUrl,
    returnUrl,
    metadata = {},
    autoSubmit = true,
    ...props
}) => {
    const formRef = useRef(null);

    useEffect(() => {
        // Auto-submit the form if autoSubmit is true
        if (autoSubmit && formRef.current) {
            formRef.current.submit();
        }
    }, [autoSubmit]);

    // Validate required fields
    if (!publicKey || !txRef || !amount || !email) {
        return (
            <Card>
                <Alert
                    message="Payment Error"
                    description="Missing required payment information. Please contact support."
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <Card style={{ maxWidth: 500, margin: '20px auto', textAlign: 'center' }}>
            {autoSubmit && (
                <>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                        <Text>Redirecting to payment page...</Text>
                    </div>
                </>
            )}

            <form
                ref={formRef}
                method="POST"
                action="https://api.chapa.co/v1/hosted/pay"
                style={{ display: autoSubmit ? 'none' : 'block' }}
            >
                {/* Required Fields */}
                <input type="hidden" name="public_key" value={publicKey} />
                <input type="hidden" name="tx_ref" value={txRef} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="currency" value={currency} />
                <input type="hidden" name="email" value={email} />

                {/* Optional Fields */}
                {firstName && <input type="hidden" name="first_name" value={firstName} />}
                {lastName && <input type="hidden" name="last_name" value={lastName} />}
                {title && <input type="hidden" name="title" value={title} />}
                {description && <input type="hidden" name="description" value={description} />}
                {logo && <input type="hidden" name="logo" value={logo} />}
                {callbackUrl && <input type="hidden" name="callback_url" value={callbackUrl} />}
                {returnUrl && <input type="hidden" name="return_url" value={returnUrl} />}

                {/* Direct Charge Fields */}
                {/* Note: Check Chapa docs if these are supported in Hosted Pay, but adding just in case */}
                {props.paymentMethod && <input type="hidden" name="payment_method" value={props.paymentMethod} />}
                {props.phoneNumber && <input type="hidden" name="phone_number" value={props.phoneNumber} />}

                {/* Metadata Fields */}
                {Object.entries(metadata).map(([key, value]) => (
                    <input
                        key={key}
                        type="hidden"
                        name={`meta[${key}]`}
                        value={value}
                    />
                ))}

                {!autoSubmit && (
                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#1890ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        Pay Now - ETB {amount}
                    </button>
                )}
            </form>
        </Card>
    );
};

ChapaCheckout.propTypes = {
    publicKey: PropTypes.string.isRequired,
    txRef: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currency: PropTypes.string,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    callbackUrl: PropTypes.string,
    returnUrl: PropTypes.string,
    metadata: PropTypes.object,
    autoSubmit: PropTypes.bool
};

export default ChapaCheckout;
