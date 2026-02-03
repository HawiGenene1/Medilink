const PharmacyOwner = require('../models/PharmacyOwner');
const Pharmacy = require('../models/Pharmacy');
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
    console.log('[Dashboard] Fetching stats for pharmacy:', pharmacyId);
    console.log('[Dashboard] Owner data:', req.owner);

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

const User = require('../models/User');

/**
 * @desc    Get Current Owner Profile
 * @route   GET /api/pharmacy-owner/profile
 * @access  Private (Pharmacy Owner only)
 */
const getProfile = asyncHandler(async (req, res, next) => {
    let owner = await PharmacyOwner.findById(req.owner._id).populate('pharmacyId');

    // Fallback to User model
    if (!owner) {
        owner = await User.findById(req.owner._id);
    }

    if (!owner) {
        return next(new ErrorResponse('Owner profile not found', 404));
    }

    // Normalize response for User model
    const isUser = !owner.fullName; // Simple check, or check instanceof User
    const responseOwner = isUser ? {
        id: owner._id,
        fullName: `${owner.firstName} ${owner.lastName}`,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        permissions: owner.permissions,
        operationalPermissions: owner.settings || {}, // Map to settings or empty for now
        subscriptionPlan: 'PRO', // Default or fetch from Pharmacy if available
        subscriptionStatus: 'active',
        pharmacy: owner.pharmacyId // User model has this field
    } : {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        role: 'pharmacy_owner',
        permissions: owner.permissions,
        operationalPermissions: owner.operationalPermissions,
        subscriptionPlan: owner.subscriptionPlan,
        subscriptionStatus: owner.subscriptionStatus,
        pharmacy: owner.pharmacyId
    };

    // If it's a User, we might want to populate pharmacy details if needed, 
    // but the frontend expects 'pharmacy' to be an object or ID? 
    // Original code: .populate('pharmacyId'). 
    // If owner.pharmacyId is an ID, we might need to populate it if frontend expects object.
    // Let's assume frontend handles ID or object, but the original populated it.
    // If it is a User, we can populate it.
    if (isUser && owner.pharmacyId) {
        const pharmacy = await Pharmacy.findById(owner.pharmacyId);
        responseOwner.pharmacy = pharmacy;
        // Also try to get subscription info from Pharmacy
        if (pharmacy && pharmacy.subscription) {
            // If we had a Subscription model, we could fetch it.
            // For now, use defaults or what's on Pharmacy if any.
            // Pharmacy model in Step 2467 has subscription ref.
        }
    }

    res.json({
        success: true,
        owner: responseOwner
    });
});

/**
 * @desc    Update Owner Profile
 * @route   PUT /api/pharmacy-owner/profile
 * @access  Private (Pharmacy Owner only)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
    const { fullName, phone, operationalPermissions } = req.body;

    let owner = await PharmacyOwner.findById(req.owner._id);
    let isUser = false;

    if (!owner) {
        owner = await User.findById(req.owner._id);
        isUser = !!owner;
    }

    if (!owner) {
        return next(new ErrorResponse('Owner profile not found', 404));
    }

    if (isUser) {
        if (fullName) {
            const parts = fullName.split(' ');
            owner.firstName = parts[0];
            owner.lastName = parts.slice(1).join(' ') || owner.lastName;
        }
        if (phone) owner.phone = phone;
        // Operational Permissions not fully supported on User yet, 
        // strictly ignoring to avoid schema error, or could map to settings.
    } else {
        if (fullName) owner.fullName = fullName;
        if (phone) owner.phone = phone;
        if (operationalPermissions) {
            // ... legacy logic ...
            if (operationalPermissions.manageInventory === true && operationalPermissions.prepareOrders === true) {
                return next(new ErrorResponse('Please choose only one operational permission at a time', 400));
            }
            if (operationalPermissions.manageInventory === false && operationalPermissions.prepareOrders === false) {
                return next(new ErrorResponse('At least one operational mode must be enabled', 400));
            }
            owner.operationalPermissions = { ...owner.operationalPermissions, ...operationalPermissions };
            owner.markModified('operationalPermissions');
        }
    }

    try {
        await owner.save();
    } catch (saveError) {
        console.error('[ProfileUpdate] Save failed:', saveError);
        return next(new ErrorResponse('Failed to save profile changes. Please try again.', 500));
    }

    const responseOwner = isUser ? {
        id: owner._id,
        fullName: `${owner.firstName} ${owner.lastName}`,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        operationalPermissions: {}
    } : {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        role: 'pharmacy_owner',
        operationalPermissions: owner.operationalPermissions
    };

    res.json({
        success: true,
        message: 'Profile updated successfully',
        owner: responseOwner
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
    let owner = await PharmacyOwner.findById(req.owner._id).select('+password');
    if (!owner) {
        owner = await User.findById(req.owner._id).select('+password');
    }

    if (!owner) {
        return next(new ErrorResponse('Owner not found', 404));
    }

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

    // 3. Summary stats
    const [pendingOrders, totalOrders, totalSalesStats, lowStockCount, staffCount] = await Promise.all([
        Order.countDocuments({ pharmacy: pharmacyId, status: 'pending' }),
        Order.countDocuments({ pharmacy: pharmacyId }),
        Order.aggregate([
            {
                $match: {
                    pharmacy: new mongoose.Types.ObjectId(pharmacyId),
                    status: { $in: ['delivered', 'completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$finalAmount' }
                }
            }
        ]),
        Inventory.countDocuments({
            pharmacy: pharmacyId,
            isActive: true,
            $expr: { $lte: ['$quantity', '$reorderLevel'] }
        }),
        PharmacyStaff.countDocuments({ pharmacy: pharmacyId, isActive: true })
    ]);

    const totalRevenue = totalSalesStats.length > 0 ? totalSalesStats[0].totalRevenue : 0;

    res.json({
        success: true,
        data: {
            summary: {
                totalRevenue,
                totalOrders,
                pendingOrders,
                lowStockCount,
                staffCount
            },
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
