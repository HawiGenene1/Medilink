const axios = require('axios');

class ChapaService {
    constructor() {
        this.secretKey = process.env.CHAPA_SECRET_KEY;
        this.baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
    }

    /**
     * Initialize a payment
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initializePayment(paymentData) {
        try {
            // Ensure we use the latest env variables
            const secretKey = process.env.CHAPA_SECRET_KEY;
            const baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

            const {
                amount,
                currency = 'ETB',
                email,
                firstName,
                lastName,
                phoneNumber,
                txRef,
                callbackUrl,
                returnUrl,
                customization = {},
                invoiceItems = []
            } = paymentData;

            // Format invoice items for meta field
            const formattedInvoices = invoiceItems.length > 0
                ? JSON.stringify(invoiceItems.map(item => ({
                    key: item.name || item.key,
                    value: item.quantity ? `${item.quantity}pcs` : item.value
                })))
                : '[]';

            const payload = {
                amount: amount.toString(),
                currency,
                email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                tx_ref: txRef,
                callback_url: callbackUrl || `${process.env.BACKEND_URL}/api/v1/payments/callbacks/chapa/callback`,
                return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                'customization[title]': customization.title || 'MediLink Payment',
                'customization[description]': customization.description || 'Payment for medicine order',
                'meta[hide_receipt]': 'true',
                'meta[invoices]': formattedInvoices
            };

            const response = await axios.post(
                `${baseURL}/transaction/initialize`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Handle successful response: { "message": "Hosted Link", "status": "success", "data": { "checkout_url": "..." } }
            if (response.data.status === 'success' && response.data.data) {
                return {
                    success: true,
                    status: 'success',
                    message: response.data.message,
                    data: response.data.data,
                    checkoutUrl: response.data.data.checkout_url
                };
            } else {
                // Handle failed response from Chapa
                return {
                    success: false,
                    status: 'failed',
                    message: response.data.message || 'Payment initialization failed',
                    error: response.data.message
                };
            }
        } catch (error) {
            console.error('Chapa initialization error:', error.response?.data || error.message);
            // Handle failed response: { "message": "Authorization required", "status": "failed", "data": null }
            if (error.response?.data) {
                return {
                    success: false,
                    status: 'failed',
                    message: error.response.data.message || 'Payment initialization failed',
                    error: error.response.data.message
                };
            }
            return {
                success: false,
                status: 'failed',
                message: 'Failed to initialize payment',
                error: error.message
            };
        }
    }

    /**
     * Verify a payment
     * @param {string} txRef - Transaction reference
     * @returns {Promise<Object>} - Verification result
     */
    async verifyPayment(txRef) {
        try {
            if (!txRef) {
                return {
                    success: false,
                    status: 'failed',
                    error: 'Transaction reference is required'
                };
            }

            const secretKey = process.env.CHAPA_SECRET_KEY;
            const baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

            const response = await axios.get(
                `${baseURL}/transaction/verify/${txRef}`,
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            // Check Chapa's response structure
            if (response.data && response.data.status === 'success') {
                return {
                    success: true,
                    status: 'success',
                    data: response.data.data,
                    ...response.data.data
                };
            } else {
                return {
                    success: false,
                    status: 'failed',
                    message: response.data?.message || 'Payment verification failed'
                };
            }
        } catch (error) {
            console.error('Chapa verification error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'failed',
                error: error.response?.data?.message || error.message || 'Network error occurred'
            };
        }
    }

    /**
     * Process refund
     * @param {string} txRef - Transaction reference
     * @param {number} amount - Amount to refund
     * @param {string} reason - Refund reason
     * @returns {Promise<Object>} - Refund result
     */
    async processRefund(txRef, amount, reason) {
        try {
            const secretKey = process.env.CHAPA_SECRET_KEY;
            const baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

            const payload = {
                tx_ref: txRef,
                amount: parseFloat(amount),
                reason: reason || 'Customer requested refund'
            };

            const response = await axios.post(
                `${baseURL}/transaction/refund`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Chapa refund error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'failed',
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Cancel a transaction
     * @param {string} txRef - Transaction reference
     * @returns {Promise<Object>} - Cancellation result
     */
    async cancelTransaction(txRef) {
        try {
            const secretKey = process.env.CHAPA_SECRET_KEY;
            const baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

            const response = await axios.put(
                `${baseURL}/transaction/cancel/${txRef}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`
                    }
                }
            );

            return {
                success: true,
                status: 'success',
                message: 'Transaction cancelled successfully',
                data: response.data
            };
        } catch (error) {
            console.error('Chapa cancel transaction error:', error.response?.data || error.message);
            return {
                success: false,
                status: 'failed',
                message: 'Failed to cancel transaction',
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new ChapaService();
