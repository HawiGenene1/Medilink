const PharmacyOwner = require('../models/PharmacyOwner');
const { generateToken } = require('../config/jwt');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Register a new Pharmacy Owner
 * @route   POST /api/pharmacy-owner/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
    const { fullName, email, phone, password, pharmacyId, subscriptionPlan } = req.body;

    try {
        // Check if owner already exists
        const existingOwner = await PharmacyOwner.findOne({ email });
        if (existingOwner) {
            return next(new ErrorResponse('A pharmacy owner with this email already exists', 400));
        }
        // Create new owner
        const owner = await PharmacyOwner.create({
            fullName,
            email,
            phone,
            password,
            pharmacyId,
            subscriptionPlan
        });
        const token = generateToken({
            ownerId: owner._id,
            email: owner.email,
            role: 'pharmacy_owner'
        });

        res.status(201).json({
            success: true,
            message: 'Pharmacy owner registered successfully',
            token,
            owner: {
                id: owner._id,
                fullName: owner.fullName,
                email: owner.email,
                phone: owner.phone,
                role: 'pharmacy_owner',
                permissions: owner.permissions,
                subscriptionPlan: owner.subscriptionPlan,
                subscriptionStatus: owner.subscriptionStatus
            }
        });
    } catch (error) {
        console.error('[Owner Register] Error during registration:', error);
        return next(new ErrorResponse(error.message, 500));
    }
});

/**
 * @desc    Authenticate Pharmacy Owner & get token
 * @route   POST /api/pharmacy-owner/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Try finding in User model first (New Flow)
    const user = await require('../models/User').findOne({ email }).select('+password');

    if (user) {
        // Check allowed roles
        const allowedRoles = ['pharmacy_admin', 'pharmacy_owner', 'system_admin'];
        if (!allowedRoles.includes(user.role)) {
            return next(new ErrorResponse('Access denied. Not a pharmacy admin.', 403));
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        if (!user.isActive) {
            return next(new ErrorResponse('Account is deactivated. Please contact support.', 403));
        }

        // Handle pending status
        if (user.status !== 'active') {
            return next(new ErrorResponse(`Account is ${user.status}. Please wait for approval.`, 403));
        }

        const token = generateToken({
            userId: user._id,
            role: user.role,
        });
        // Generate response object compatible with frontend expectations
        res.json({
            success: true,
            message: 'Login successful',
            token,
            owner: {
                id: user._id,
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions: user.permissions,
                operationalPermissions: user.operationalPermissions.toObject ? user.operationalPermissions.toObject() : user.operationalPermissions,
                // Subscription info usually on Pharmacy, might be undefined here but dashboard fetches it
                pharmacyId: user.pharmacyId
            }
        });
        return;
    }

    // Fallback: Try PharmacyOwner (Legacy)
    const owner = await PharmacyOwner.findOne({ email }).select('+password');
    if (!owner) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check password
    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if account is active
    if (!owner.isActive) {
        return next(new ErrorResponse('Account is deactivated. Please contact support.', 403));
    }

    const token = generateToken({
        ownerId: owner._id,
        email: owner.email,
        role: 'pharmacy_owner'
    });

    res.json({
        success: true,
        message: 'Login successful',
        token,
        owner: {
            id: owner._id,
            fullName: owner.fullName,
            email: owner.email,
            role: 'pharmacy_owner',
            permissions: owner.permissions,
            operationalPermissions: owner.operationalPermissions,
            subscriptionPlan: owner.subscriptionPlan,
            subscriptionStatus: owner.subscriptionStatus,
            pharmacyId: owner.pharmacyId
        }
    });
});

module.exports = {
    register,
    login
};
