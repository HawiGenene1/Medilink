const Notification = require('../models/Notification');
<<<<<<< HEAD
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get notifications for a pharmacy
 * @route   GET /api/notifications
 * @access  Private (Pharmacy Owner/Staff)
 */
exports.getPharmacyNotifications = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    const role = req.user?.role || req.owner?.role;

    if (!pharmacyId) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    // Determine roleTarget based on user role
    let roleTarget;
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === 'pharmacy_owner' || normalizedRole === 'pharmacy_admin') {
        roleTarget = 'OWNER';
    } else if (['pharmacy_staff', 'staff', 'pharmacist', 'cashier', 'technician', 'assistant'].includes(normalizedRole)) {
        roleTarget = 'STAFF';
    } else {
        return next(new ErrorResponse(`Invalid role for notifications: ${role}`, 403));
    }

    const { isRead, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
        pharmacyId: pharmacyId,
        roleTarget: roleTarget
    };

    if (isRead !== undefined) {
        query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
        pharmacyId: pharmacyId,
        roleTarget: roleTarget,
        isRead: false
    });

    res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        unreadCount,
        data: notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Pharmacy Owner/Staff)
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;

    const notification = await Notification.findById(id);

    if (!notification) {
        return next(new ErrorResponse(`Notification not found with id of ${id}`, 404));
    }

    // Verify ownership
    if (notification.pharmacyId.toString() !== pharmacyId.toString()) {
        return next(new ErrorResponse('Not authorized to update this notification', 403));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        data: notification
    });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private (Pharmacy Owner/Staff)
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    const role = req.user?.role || req.owner?.role;

    if (!pharmacyId) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    // Determine roleTarget
    let roleTarget;
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === 'pharmacy_owner' || normalizedRole === 'pharmacy_admin') {
        roleTarget = 'OWNER';
    } else if (['pharmacy_staff', 'staff', 'pharmacist', 'cashier', 'technician', 'assistant'].includes(normalizedRole)) {
        roleTarget = 'STAFF';
    } else {
        return next(new ErrorResponse(`Invalid role for notifications: ${role}`, 403));
    }

    const result = await Notification.updateMany(
        {
            pharmacyId: pharmacyId,
            roleTarget: roleTarget,
            isRead: false
        },
        {
            isRead: true
        }
    );

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Pharmacy Owner/Staff)
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;

    const notification = await Notification.findById(id);

    if (!notification) {
        return next(new ErrorResponse(`Notification not found with id of ${id}`, 404));
    }

    // Verify ownership
    if (notification.pharmacyId.toString() !== pharmacyId.toString()) {
        return next(new ErrorResponse('Not authorized to delete this notification', 403));
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Notification deleted'
    });
});
=======
const logger = require('../utils/logger');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

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
        const userId = req.user.userId || req.user.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: userId },
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
        const userId = req.user.userId || req.user.id;
        await Notification.updateMany(
            { user: userId, isRead: false },
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
        const userId = req.user.userId || req.user.id;
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: userId });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
