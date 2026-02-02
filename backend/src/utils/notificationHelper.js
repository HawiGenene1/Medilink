const Notification = require('../models/Notification');
const { getIo } = require('../socket');
const logger = require('./logger');

/**
 * Create a notification and emit via socket
 * @param {Object} params
 * @param {String} params.userId - Recipient user ID
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {String} params.type - Type (order_update, promotion, system, account)
 * @param {String} params.link - (Optional) App link
 * @param {Object} params.metadata - (Optional) Additional data
 */
const createNotification = async ({ userId, title, message, type = 'system', link = '', metadata = {} }) => {
    try {
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            link,
            metadata
        });

        await notification.save();

        // Emit via Socket.io if recipient is online
        const io = getIo();
        if (io) {
            io.to(userId.toString()).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        logger.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    createNotification
};
