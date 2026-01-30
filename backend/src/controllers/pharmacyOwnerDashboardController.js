const PharmacyOwner = require('../models/PharmacyOwner');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const PharmacyStaff = require('../models/PharmacyStaff');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get dashboard statistics for a Pharmacy Owner
 * @route   GET /api/pharmacy-owner/dashboard
 * @access  Private (Pharmacy Owner only)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.owner.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('No pharmacy associated with this owner', 400));
    }

    // Prepare aggregation for sales stats
    const salesStatsPromise = Order.aggregate([
        {
            $match: {
                pharmacy: new mongoose.Types.ObjectId(pharmacyId),
                status: { $in: ['delivered', 'completed'] }
            }
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$finalAmount' },
                orderCount: { $sum: 1 }
            }
        }
    ]);

    // Use Promise.all for parallel counting
    const [salesStats, totalOrders, totalProducts, totalStaff] = await Promise.all([
        salesStatsPromise,
        Order.countDocuments({ pharmacy: pharmacyId }),
        Inventory.countDocuments({ pharmacy: pharmacyId, isActive: true }),
        PharmacyStaff.countDocuments({ pharmacy: pharmacyId, isActive: true })
    ]);

    const totalSales = salesStats.length > 0 ? salesStats[0].totalSales : 0;

    // Fetch recent orders
    const recentOrders = await Order.find({ pharmacy: pharmacyId })
        .populate('customer', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        success: true,
        data: {
            stats: {
                totalSales,
                totalOrders,
                totalProducts,
                totalStaff
            },
            recentOrders
        }
    });
});

/**
 * @desc    Get Current Owner Profile
 * @route   GET /api/pharmacy-owner/profile
 * @access  Private (Pharmacy Owner only)
 */
const getProfile = asyncHandler(async (req, res, next) => {
    const owner = await PharmacyOwner.findById(req.owner._id).populate('pharmacyId');

    if (!owner) {
        return next(new ErrorResponse('Owner profile not found', 404));
    }

    res.json({
        success: true,
        owner: {
            id: owner._id,
            fullName: owner.fullName,
            email: owner.email,
            phone: owner.phone,
            role: 'PHARMACY_OWNER',
            permissions: owner.permissions,
            subscriptionPlan: owner.subscriptionPlan,
            subscriptionStatus: owner.subscriptionStatus,
            pharmacy: owner.pharmacyId
        }
    });
});

/**
 * @desc    Update Owner Profile
 * @route   PUT /api/pharmacy-owner/profile
 * @access  Private (Pharmacy Owner only)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
    const { fullName, phone } = req.body;

    const owner = await PharmacyOwner.findById(req.owner._id);

    if (!owner) {
        return next(new ErrorResponse('Owner profile not found', 404));
    }

    if (fullName) owner.fullName = fullName;
    if (phone) owner.phone = phone;

    await owner.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        owner: {
            id: owner._id,
            fullName: owner.fullName,
            email: owner.email,
            phone: owner.phone,
            role: 'PHARMACY_OWNER'
        }
    });
});

/**
 * @desc    Update Owner Password
 * @route   PUT /api/pharmacy-owner/profile/password
 * @access  Private (Pharmacy Owner only)
 */
const updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new ErrorResponse('Please provide current and new password', 400));
    }

    // Get owner with password
    const owner = await PharmacyOwner.findById(req.owner._id).select('+password');

    // Check current password
    const isMatch = await owner.comparePassword(currentPassword);
    if (!isMatch) {
        return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Set new password (middleware will hash it)
    owner.password = newPassword;
    await owner.save();

    res.json({
        success: true,
        message: 'Password updated successfully'
    });
});

/**
 * @desc    Get Current Subscription Details
 * @route   GET /api/pharmacy-owner/subscription
 * @access  Private (Pharmacy Owner only)
 */
const getSubscriptionDetails = asyncHandler(async (req, res, next) => {
    // We can rely on req.owner if it was already fetched in middleware
    // but to get fresh data including any updates:
    const owner = await PharmacyOwner.findById(req.owner._id);

    if (!owner) {
        return next(new ErrorResponse('Owner account not found', 404));
    }

    res.json({
        success: true,
        data: {
            plan: owner.subscriptionPlan,
            status: owner.subscriptionStatus,
            startDate: owner.subscriptionStartDate,
            endDate: owner.subscriptionEndDate
        }
    });
});

/**
 * @desc    Get aggregated business reports for a Pharmacy Owner
 * @route   GET /api/pharmacy-owner/reports
 * @access  Private (Pharmacy Owner only)
 */
const getReports = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.owner.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('No pharmacy associated with this owner', 400));
    }

    // 1. Sales trends (revenue and order count by month)
    const salesTrends = await Order.aggregate([
        {
            $match: {
                pharmacy: new mongoose.Types.ObjectId(pharmacyId),
                status: { $in: ['delivered', 'completed'] }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$finalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    // 2. Staff growth trend (new staff by month)
    const staffTrends = await PharmacyStaff.aggregate([
        {
            $match: {
                pharmacy: new mongoose.Types.ObjectId(pharmacyId)
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                totalNew: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    res.json({
        success: true,
        data: {
            salesTrends,
            staffTrends
        }
    });
});

/**
 * @desc    Get Pharmacy Details for the Owner
 * @route   GET /api/pharmacy-owner/pharmacy
 * @access  Private (Pharmacy Owner only)
 */
const getPharmacy = asyncHandler(async (req, res, next) => {
    const pharmacy = await Pharmacy.findById(req.owner.pharmacyId);

    if (!pharmacy) {
        return next(new ErrorResponse('Pharmacy not found', 404));
    }

    res.json({
        success: true,
        data: pharmacy
    });
});

/**
 * @desc    Update Pharmacy Details
 * @route   PUT /api/pharmacy-owner/pharmacy
 * @access  Private (Pharmacy Owner only)
 */
const updatePharmacy = asyncHandler(async (req, res, next) => {
    let pharmacy = await Pharmacy.findById(req.owner.pharmacyId);

    if (!pharmacy) {
        return next(new ErrorResponse('Pharmacy not found', 404));
    }

    // Update fields
    pharmacy = await Pharmacy.findByIdAndUpdate(req.owner.pharmacyId, req.body, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: pharmacy
    });
});

/**
 * @desc    Get In-depth Analytics for Pharmacy Owner
 * @route   GET /api/pharmacy-owner/analytics
 * @access  Private (Pharmacy Owner only)
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.owner.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('No pharmacy associated with this owner', 400));
    }

    // 1. Aggregate Total Revenue and Total Orders
    const salesStats = await Order.aggregate([
        {
            $match: {
                pharmacy: new mongoose.Types.ObjectId(pharmacyId),
                status: { $in: ['delivered', 'completed'] }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$finalAmount' },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // 2. Count Active Staff
    const staffCount = await PharmacyStaff.countDocuments({
        pharmacy: pharmacyId,
        isActive: true
    });

    // 3. Sales Trend for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesTrend = await Order.aggregate([
        {
            $match: {
                pharmacy: new mongoose.Types.ObjectId(pharmacyId),
                status: { $in: ['delivered', 'completed'] },
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                total: { $sum: '$finalAmount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format results to be "safe" (empty arrays/zeros if no data)
    const stats = salesStats.length > 0 ? salesStats[0] : { totalRevenue: 0, totalOrders: 0 };

    res.json({
        success: true,
        data: {
            summary: {
                totalRevenue: stats.totalRevenue,
                totalOrders: stats.totalOrders,
                staffCount
            },
            trends: {
                salesOverTime: salesTrend
            }
        }
    });
});

module.exports = {
    getDashboardStats,
    getProfile,
    updateProfile,
    updatePassword,
    getSubscriptionDetails,
    getReports,
    getPharmacy,
    updatePharmacy,
    getAnalytics
};
