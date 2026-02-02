const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * @desc    Get notifications for the current user or pharmacy
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId || req.user.id;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    const role = (req.user?.role || req.owner?.role || '').toLowerCase();

    const { isRead, limit = 50, page = 1, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // If it's a pharmacy staff/owner, they might want pharmacy-wide notifications
    if (pharmacyId && ['pharmacy_owner', 'pharmacy_admin', 'pharmacy_staff', 'staff', 'pharmacist', 'cashier', 'technician', 'assistant'].includes(role)) {
        let roleTarget;
        if (role === 'pharmacy_owner' || role === 'pharmacy_admin') {
            roleTarget = 'OWNER';
        } else {
            roleTarget = 'STAFF';
        }

        // Multi-condition query: either direct user notification OR pharmacy-wide for that role
        query = {
            $or: [
                { user: userId },
                { pharmacyId: pharmacyId, roleTarget: roleTarget }
            ]
        };
    } else {
        // Just regular user notifications
        query = { user: userId };
    }

    if (isRead !== undefined) {
        query.isRead = isRead === 'true';
    }

    if (type) {
        query.type = type;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

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

// Alias for compatibility
exports.getPharmacyNotifications = exports.getNotifications;

/**
 * @desc    Mark notification as read
 * @route   PATCH/PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;

    const notification = await Notification.findById(id);

    if (!notification) {
        return next(new ErrorResponse(`Notification not found with id of ${id}`, 404));
    }

    // Verify ownership: either it's their user ID or their pharmacy ID
    const isOwner = notification.user && notification.user.toString() === userId.toString();
    const isPharmacyOwner = pharmacyId && notification.pharmacyId && notification.pharmacyId.toString() === pharmacyId.toString();

    if (!isOwner && !isPharmacyOwner) {
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
 * @route   PATCH/PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId || req.user.id;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    const role = (req.user?.role || req.owner?.role || '').toLowerCase();

    let query = {};

    if (pharmacyId && ['pharmacy_owner', 'pharmacy_admin', 'pharmacy_staff', 'staff', 'pharmacist', 'cashier', 'technician', 'assistant'].includes(role)) {
        let roleTarget;
        if (role === 'pharmacy_owner' || role === 'pharmacy_admin') {
            roleTarget = 'OWNER';
        } else {
            roleTarget = 'STAFF';
        }

        query = {
            $or: [
                { user: userId, isRead: false },
                { pharmacyId: pharmacyId, roleTarget: roleTarget, isRead: false }
            ]
        };
    } else {
        query = { user: userId, isRead: false };
    }

    const result = await Notification.updateMany(query, { isRead: true });

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;

    const notification = await Notification.findById(id);

    if (!notification) {
        return next(new ErrorResponse(`Notification not found with id of ${id}`, 404));
    }

    // Verify ownership
    const isOwner = notification.user && notification.user.toString() === userId.toString();
    const isPharmacyOwner = pharmacyId && notification.pharmacyId && notification.pharmacyId.toString() === pharmacyId.toString();

    if (!isOwner && !isPharmacyOwner) {
        return next(new ErrorResponse('Not authorized to delete this notification', 403));
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Notification deleted'
    });
});
