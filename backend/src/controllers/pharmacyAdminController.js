const TempPharmacy = require('../models/TempPharmacy');
const Pharmacy = require('../models/Pharmacy');
const Subscription = require('../models/Subscription');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/pharmacy-admin/dashboard-stats
 * @desc    Get platform-wide statistics for dashboard
 * @access  Private/Pharmacy Admin
 */
const SUBSCRIPTION_PLANS = require('../config/subscriptionPlans');

const getDashboardStats = async (req, res) => {
    try {
        // Count registrations by status
        const pendingRequests = await TempPharmacy.countDocuments({ status: 'pending' });
        const approvedRequests = await TempPharmacy.countDocuments({ status: 'approved' });
        const rejectedRequests = await TempPharmacy.countDocuments({ status: 'rejected' });
        const totalRequests = await TempPharmacy.countDocuments();

        // Count pharmacies by status
        const totalPharmacies = await Pharmacy.countDocuments();
        const activePharmacies = await Pharmacy.countDocuments({ isActive: true, status: 'approved' });
        const suspendedPharmacies = await Pharmacy.countDocuments({ isActive: false });

        // Calculate subscription revenue
        const subscriptions = await Subscription.find({ status: 'active' });
        const monthlyRevenue = subscriptions.reduce((sum, sub) => {
            const plan = SUBSCRIPTION_PLANS[sub.plan];
            return sum + (plan ? (sub.price || plan.price) : 0);
        }, 0);

        // Count expiring subscriptions (next 30 days)
        const expiringCount = await Subscription.countDocuments({
            status: 'active',
            endDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // Get recent activities (last 10 registration/subscription actions)
        const recentRegistrations = await TempPharmacy.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('pharmacyName email status createdAt');

        // Optional: Combine with subscription history if desired
        // For now, focusing on registration activity as it's the primary feed

        res.json({
            success: true,
            data: {
                pharmacies: {
                    total: totalPharmacies,
                    active: activePharmacies,
                    suspended: suspendedPharmacies,
                    pending: pendingRequests,
                    approved: approvedRequests,
                    rejected: rejectedRequests,
                    totalRequests: totalRequests
                },
                subscriptions: {
                    active: subscriptions.length,
                    expiring: expiringCount,
                    monthlyRevenue
                },
                recentActivity: recentRegistrations
            }
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard statistics',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/registrations
 * @desc    Get all pharmacy registration requests
 * @access  Private/Pharmacy Admin
 */
const getRegistrations = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 10, search } = req.query;

        const query = { status };
        if (search) {
            query.$or = [
                { pharmacyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const registrations = await TempPharmacy.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await TempPharmacy.countDocuments(query);

        res.json({
            success: true,
            data: registrations,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                pageSize: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching registrations',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/registrations/:id
 * @desc    Get single pharmacy registration details
 * @access  Private/Pharmacy Admin
 */
const getRegistrationDetails = async (req, res) => {
    try {
        const registration = await TempPharmacy.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Normalize documents into an array for easier frontend rendering
        const registrationObj = registration.toObject();
        registrationObj.documents = [];

        if (registration.licenseDocument) {
            registrationObj.documents.push({
                name: 'Business License',
                url: registration.licenseDocument,
                type: 'license'
            });
        }

        if (registration.tinDocument) {
            registrationObj.documents.push({
                name: 'TIN Certificate',
                url: registration.tinDocument,
                type: 'tin'
            });
        }

        res.json({
            success: true,
            data: registrationObj
        });
    } catch (error) {
        logger.error('Error fetching registration details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching registration details',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/pharmacy-admin/registrations/:id/approve
 * @desc    Approve a pharmacy registration
 * @access  Private/Pharmacy Admin
 */
const approveRegistration = async (req, res) => {
    try {
        const tempPharmacy = await TempPharmacy.findById(req.params.id);

        if (!tempPharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        if (tempPharmacy.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending registrations can be approved'
            });
        }

        const { subscriptionPlan } = req.body;

        if (!subscriptionPlan || !SUBSCRIPTION_PLANS[subscriptionPlan]) {
            return res.status(400).json({
                success: false,
                message: 'A valid subscription plan is required for approval'
            });
        }

        const planData = SUBSCRIPTION_PLANS[subscriptionPlan];

        // Check if user already exists
        let user = await User.findOne({ email: tempPharmacy.email });
        const generatePassword = require('../utils/passwordGenerator').generatePassword;
        const generatedPassword = generatePassword(12);

        if (!user) {
            user = new User({
                firstName: tempPharmacy.ownerName.split(' ')[0],
                lastName: tempPharmacy.ownerName.split(' ').slice(1).join(' ') || 'Owner',
                email: tempPharmacy.email,
                phone: tempPharmacy.phone,
                role: 'pharmacy_owner',
                status: 'active',
                isEmailVerified: true
            });
        }

        // Always reset password on approval to ensure consistency
        user.password = generatedPassword;
        user.status = 'active';
        user.isEmailVerified = true;

        // Check if pharmacy already exists
        let pharmacy = await Pharmacy.findOne({ email: tempPharmacy.email });
        if (!pharmacy) {
            const pharmacyAddress = {
                street: tempPharmacy.address?.street || '',
                city: tempPharmacy.address?.city || '',
                state: tempPharmacy.address?.state || '',
                zipCode: tempPharmacy.address?.postalCode || tempPharmacy.address?.zipCode || '0000',
                country: tempPharmacy.address?.country || 'Ethiopia'
            };

            pharmacy = new Pharmacy({
                name: tempPharmacy.pharmacyName,
                ownerName: tempPharmacy.ownerName,
                licenseNumber: tempPharmacy.licenseNumber,
                licenseExpiryDate: tempPharmacy.licenseExpiryDate,
                email: tempPharmacy.email,
                phone: tempPharmacy.phone,
                address: pharmacyAddress,
                location: {
                    type: 'Point',
                    coordinates: [38.7578, 9.0227]
                },
                owner: user._id,
                status: 'approved',
                isActive: true,
                isVerified: true
            });
            await pharmacy.save();
        } else {
            // Update existing pharmacy status
            pharmacy.status = 'approved';
            pharmacy.isActive = true;
            pharmacy.isVerified = true;
            await pharmacy.save();
        }

        // Link user to pharmacy and save ONCE
        user.pharmacyId = pharmacy._id;
        await user.save();

        // Update temp pharmacy status
        tempPharmacy.status = 'approved';
        await tempPharmacy.save();

        // Create subscription record
        const subscription = new Subscription({
            pharmacy: pharmacy._id,
            plan: subscriptionPlan,
            price: planData.price,
            currency: planData.currency || 'ETB',
            features: planData.features,
            maxStaff: planData.maxStaff,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
            status: 'active',
            isActive: true,
            payment: {
                status: 'completed',
                method: 'cash',
                paidDate: new Date()
            }
        });

        await subscription.save();

        // Update pharmacy with subscription reference
        pharmacy.subscription = subscription._id;
        await pharmacy.save();

        // Send approval email with credentials
        const { sendWelcomeEmail } = require('../services/emailService');
        sendWelcomeEmail(tempPharmacy.email, tempPharmacy.ownerName, generatedPassword, undefined, 'pharmacy_owner')
            .then(() => logger.info(`Approval email sent to ${tempPharmacy.email}`))
            .catch((err) => logger.error('Failed to send approval email:', err));

        res.json({
            success: true,
            message: `Pharmacy approved successfully with ${planData.name} plan`,
            data: {
                pharmacy,
                subscription,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        logger.error('Error approving registration:', error);
        res.status(500).json({
            success: false,
            message: 'Server error approving registration',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/pharmacy-admin/registrations/:id/reject
 * @desc    Reject a pharmacy registration
 * @access  Private/Pharmacy Admin
 */
const rejectRegistration = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const tempPharmacy = await TempPharmacy.findById(req.params.id);

        if (!tempPharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        tempPharmacy.status = 'rejected';
        tempPharmacy.rejectionReason = reason;
        await tempPharmacy.save();

        // Send rejection email
        await sendEmail({
            to: tempPharmacy.email,
            subject: 'Pharmacy Registration - Application Status',
            text: `Dear ${tempPharmacy.ownerName},\n\nWe regret to inform you that your pharmacy registration application has not been approved.\n\nReason: ${reason}\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nMediLink Team`
        });

        res.json({
            success: true,
            message: 'Registration rejected',
            data: tempPharmacy
        });
    } catch (error) {
        logger.error('Error rejecting registration:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting registration',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/pharmacies
 * @desc    Get all pharmacies with filters
 * @access  Private/Pharmacy Admin
 */
const getAllPharmacies = async (req, res) => {
    try {
        const { status, isActive, page = 1, limit = 10, search } = req.query;

        const query = {};
        if (status) query.status = status;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { ownerName: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const pharmacies = await Pharmacy.find(query)
            .populate('owner', 'firstName lastName email phone')
            .populate('subscription')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Pharmacy.countDocuments(query);

        res.json({
            success: true,
            data: pharmacies,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                pageSize: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching pharmacies:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching pharmacies',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/pharmacy-admin/pharmacies/:id/status
 * @desc    Update pharmacy status (activate/suspend)
 * @access  Private/Pharmacy Admin
 */
const updatePharmacyStatus = async (req, res) => {
    try {
        const { isActive, reason } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'isActive field is required'
            });
        }

        // Require justification for suspension
        if (isActive === false && !reason) {
            return res.status(400).json({
                success: false,
                message: 'Justification reason is required for suspending a pharmacy'
            });
        }

        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        pharmacy.isActive = isActive;
        await pharmacy.save();

        // Send notification email
        const action = isActive ? 'activated' : 'suspended';
        await sendEmail({
            to: pharmacy.email,
            subject: `Pharmacy Account ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            text: `Dear ${pharmacy.ownerName},\n\nYour pharmacy account has been ${action}.\n\n${reason ? `Reason: ${reason}\n\n` : ''}If you have any questions, please contact our support team.\n\nBest regards,\nMediLink Team`
        });

        res.json({
            success: true,
            message: `Pharmacy ${action} successfully`,
            data: pharmacy
        });
    } catch (error) {
        logger.error('Error updating pharmacy status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating pharmacy status',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/subscriptions
 * @desc    Get all subscriptions with filters
 * @access  Private/Pharmacy Admin
 */
const getAllSubscriptions = async (req, res) => {
    try {
        const { status, plan, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (plan) query.plan = plan;

        const subscriptions = await Subscription.find(query)
            .populate('pharmacy', 'name email licenseNumber')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Subscription.countDocuments(query);

        res.json({
            success: true,
            data: subscriptions,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                pageSize: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching subscriptions',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/pharmacy-admin/subscriptions
 * @desc    Assign subscription to a pharmacy
 * @access  Private/Pharmacy Admin
 */
const assignSubscription = async (req, res) => {
    try {
        const { pharmacyId, plan, durationMonths } = req.body;

        if (!pharmacyId || !plan || !durationMonths) {
            return res.status(400).json({
                success: false,
                message: 'pharmacyId, plan, and durationMonths are required'
            });
        }

        const pharmacy = await Pharmacy.findById(pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

        // Use centralized plan config
        const selectedPlan = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.basic;

        const subscription = new Subscription({
            pharmacy: pharmacyId,
            plan,
            mode: parseInt(durationMonths) >= 12 ? 'annually' : 'monthly',
            status: 'active',
            startDate,
            endDate,
            isActive: true,
            maxStaff: selectedPlan.maxStaff,
            features: selectedPlan.features,
            price: selectedPlan.price
        });

        await subscription.save();

        // Update pharmacy with subscription reference
        pharmacy.subscription = subscription._id;
        await pharmacy.save();

        // Log History
        await SubscriptionHistory.create({
            subscription: subscription._id,
            pharmacy: pharmacyId,
            action: 'assigned',
            details: `Assigned ${plan} plan (${durationMonths} months)`,
            performedBy: req.user.id || req.user._id
        });

        res.json({
            success: true,
            message: 'Subscription assigned successfully',
            data: subscription
        });
    } catch (error) {
        logger.error('Error assigning subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error assigning subscription',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/pharmacy-admin/subscriptions/:id
 * @desc    Update subscription (renew, suspend)
 * @access  Private/Pharmacy Admin
 */
const updateSubscription = async (req, res) => {
    try {
        const { status, durationMonths } = req.body;

        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        if (status) {
            subscription.status = status;
            subscription.isActive = status === 'active';
        }

        if (durationMonths) {
            const newEndDate = new Date(subscription.endDate);
            newEndDate.setMonth(newEndDate.getMonth() + parseInt(durationMonths));
            subscription.endDate = newEndDate;
        }

        await subscription.save();

        // Log History
        let action = 'updated';
        let details = 'Subscription updated';

        if (durationMonths) {
            action = 'renewed';
            details = `Extended by ${durationMonths} months`;
        } else if (status) {
            action = status === 'active' ? 'activated' : 'suspended';
            details = `Status changed to ${status}`;
        }

        await SubscriptionHistory.create({
            subscription: subscription._id,
            pharmacy: subscription.pharmacy,
            action,
            details,
            performedBy: req.user._id
        });

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: subscription
        });
    } catch (error) {
        logger.error('Error updating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating subscription',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/subscription-plans
 * @desc    Get configured subscription plans
 * @access  Private/Pharmacy Admin
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        res.json({
            success: true,
            data: Object.keys(SUBSCRIPTION_PLANS).map(key => ({
                id: key,
                ...SUBSCRIPTION_PLANS[key]
            }))
        });
    } catch (error) {
        logger.error('Error fetching subscription plans:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching subscription plans',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/reports
 * @desc    Generate platform reports
 * @access  Private/Pharmacy Admin
 */
const generateReports = async (req, res) => {
    try {
        const { type = 'overview', startDate, endDate } = req.query;

        const dateQuery = {};
        if (startDate) dateQuery.$gte = new Date(startDate);
        if (endDate) dateQuery.$lte = new Date(endDate);

        let reportData = {};

        if (type === 'overview' || type === 'all') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            reportData.overview = {
                totalPharmacies: await Pharmacy.countDocuments(),
                activePharmacies: await Pharmacy.countDocuments({ isActive: true }),
                totalSubscriptions: await Subscription.countDocuments(),
                activeSubscriptions: await Subscription.countDocuments({ status: 'active' }),
                activeUsers: await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } })
            };
        }

        if (type === 'registrations' || type === 'all') {
            const registrations = await TempPharmacy.aggregate([
                ...(Object.keys(dateQuery).length ? [{ $match: { createdAt: dateQuery } }] : []),
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            reportData.registrations = registrations;
        }

        if (type === 'subscriptions' || type === 'all') {
            const subscriptions = await Subscription.aggregate([
                ...(Object.keys(dateQuery).length ? [{ $match: { createdAt: dateQuery } }] : []),
                {
                    $group: {
                        _id: '$plan',
                        count: { $sum: 1 },
                        status: { $push: '$status' }
                    }
                }
            ]);
            reportData.subscriptions = subscriptions;
        }

        if (type === 'trends' || type === 'all') {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
            twelveMonthsAgo.setDate(1);
            twelveMonthsAgo.setHours(0, 0, 0, 0);

            // Revenue trends
            const revenueTrends = await Subscription.aggregate([
                {
                    $match: {
                        createdAt: { $gte: twelveMonthsAgo },
                        'payment.status': 'completed'
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        revenue: { $sum: '$price' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Registration trends
            const growthTrends = await Pharmacy.aggregate([
                {
                    $match: {
                        createdAt: { $gte: twelveMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            reportData.trends = {
                revenue: revenueTrends,
                growth: growthTrends
            };

            // Geographic Distribution
            reportData.geographic = await Pharmacy.aggregate([
                ...(Object.keys(dateQuery).length ? [{ $match: { createdAt: dateQuery } }] : []),
                {
                    $group: {
                        _id: '$address.city',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);
        }

        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        logger.error('Error generating reports:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating reports',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/pharmacy-admin/alerts
 * @desc    Get system alerts
 * @access  Private/Pharmacy Admin
 */
const getAlerts = async (req, res) => {
    try {
        const alerts = [];

        // Pending registrations
        const pendingCount = await TempPharmacy.countDocuments({ status: 'pending' });
        if (pendingCount > 0) {
            alerts.push({
                type: 'pending_registration',
                severity: 'info',
                message: `${pendingCount} pending pharmacy registration${pendingCount > 1 ? 's' : ''} awaiting review`,
                count: pendingCount
            });
        }

        // Expiring subscriptions
        const expiringSubscriptions = await Subscription.find({
            status: 'active',
            endDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        }).populate('pharmacy', 'name');

        if (expiringSubscriptions.length > 0) {
            alerts.push({
                type: 'expiring_subscription',
                severity: 'warning',
                message: `${expiringSubscriptions.length} subscription${expiringSubscriptions.length > 1 ? 's' : ''} expiring in the next 30 days`,
                count: expiringSubscriptions.length,
                details: expiringSubscriptions.map(sub => ({
                    pharmacy: sub.pharmacy?.name,
                    endDate: sub.endDate
                }))
            });
        }

        // Expired subscriptions
        const expiredSubscriptions = await Subscription.countDocuments({
            status: 'active',
            endDate: { $lt: new Date() }
        });

        if (expiredSubscriptions > 0) {
            alerts.push({
                type: 'expired_subscription',
                severity: 'error',
                message: `${expiredSubscriptions} expired subscription${expiredSubscriptions > 1 ? 's' : ''} need attention`,
                count: expiredSubscriptions
            });
        }

        // Near Expiration Licenses (Active Pharmacies)
        const nearExpiryLicenses = await Pharmacy.find({
            status: 'approved',
            licenseExpiryDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            }
        }).select('name licenseExpiryDate');

        if (nearExpiryLicenses.length > 0) {
            alerts.push({
                type: 'near_expiry_license',
                severity: 'warning',
                message: `${nearExpiryLicenses.length} pharmacy license${nearExpiryLicenses.length > 1 ? 's' : ''} expiring within 6 months`,
                count: nearExpiryLicenses.length,
                details: nearExpiryLicenses.map(p => ({
                    pharmacy: p.name,
                    expiryDate: p.licenseExpiryDate
                }))
            });
        }

        // Expired Licenses (Active Pharmacies)
        const expiredLicenses = await Pharmacy.countDocuments({
            status: 'approved',
            licenseExpiryDate: { $lt: new Date() }
        });

        if (expiredLicenses > 0) {
            alerts.push({
                type: 'expired_license',
                severity: 'error',
                message: `${expiredLicenses} pharmacy license${expiredLicenses > 1 ? 's' : ''} have expired`,
                count: expiredLicenses
            });
        }

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        logger.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching alerts',
            error: error.message
        });
    }
};

const getSubscriptionHistory = async (req, res) => {
    try {
        const history = await SubscriptionHistory.find({ subscription: req.params.id })
            .populate('performedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Error fetching subscription history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching history',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getRegistrations,
    getRegistrationDetails,
    approveRegistration,
    rejectRegistration,
    getAllPharmacies,
    updatePharmacyStatus,
    getAllSubscriptions,
    assignSubscription,
    updateSubscription,
    generateReports,
    getAlerts,
    getSubscriptionHistory,
    getSubscriptionPlans
};
