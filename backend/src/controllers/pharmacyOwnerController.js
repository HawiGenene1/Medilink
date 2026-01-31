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
        role: 'PHARMACY_OWNER'
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
            role: 'PHARMACY_OWNER',
            permissions: owner.permissions,
            subscriptionPlan: owner.subscriptionPlan,
            subscriptionStatus: owner.subscriptionStatus
        }
    });
});

/**
 * @desc    Authenticate Pharmacy Owner & get token
 * @route   POST /api/pharmacy-owner/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Find owner and include password
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
        role: 'PHARMACY_OWNER'
    });

    res.json({
        success: true,
        message: 'Login successful',
        token,
        owner: {
            id: owner._id,
            fullName: owner.fullName,
            email: owner.email,
            role: 'PHARMACY_OWNER',
            permissions: owner.permissions,
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
