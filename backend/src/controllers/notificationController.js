const Notification = require('../models/Notification');
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
