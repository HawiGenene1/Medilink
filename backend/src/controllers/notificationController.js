const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * @route   GET /api/notifications
 * @desc    Get user or pharmacy notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const pharmacyId = req.user.pharmacyId;
        const role = req.user.role;

        // Build query
        const query = { $or: [{ user: userId }] };
        if (pharmacyId) {
            query.$or.push({ pharmacyId: pharmacyId });
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, $or: [{ user: userId }, { pharmacyId: req.user.pharmacyId }] },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const query = { $or: [{ user: userId }] };
        if (req.user.pharmacyId) {
            query.$or.push({ pharmacyId: req.user.pharmacyId });
        }

        await Notification.updateMany(
            { ...query, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            $or: [{ user: userId }, { pharmacyId: req.user.pharmacyId }]
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
