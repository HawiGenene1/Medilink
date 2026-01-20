import { message, notification } from 'antd';

/**
 * Global Toast & Notification Service for Medilink
 * Conforms to the Clinical & Modern UI guidelines
 */
const MedilinkUI = {
    // Simple toast messages
    toast: {
        success: (msg) => message.success({ content: msg, className: 'medilink-message-success' }),
        error: (msg) => message.error({ content: msg, className: 'medilink-message-error' }),
        warning: (msg) => message.warning({ content: msg, className: 'medilink-message-warning' }),
        info: (msg) => message.info({ content: msg, className: 'medilink-message-info' }),
    },

    // Rich notifications
    notify: {
        success: (title, desc) => notification.success({
            message: title,
            description: desc,
            placement: 'topRight',
            className: 'medilink-notification-success',
        }),
        error: (title, desc) => notification.error({
            message: title,
            description: desc,
            placement: 'topRight',
            className: 'medilink-notification-error',
        }),
        orderAccepted: (orderId) => notification.success({
            message: 'Order Accepted',
            description: `Your order ${orderId} has been accepted and is being prepared.`,
            placement: 'topRight',
            duration: 5,
        }),
        prescriptionApproved: () => notification.success({
            message: 'Prescription Approved',
            description: 'Your uploaded prescription has been verified.',
            placement: 'topRight',
        })
    }
};

export default MedilinkUI;
