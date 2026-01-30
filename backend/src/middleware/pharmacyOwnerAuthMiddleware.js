const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PharmacyOwner = require('../models/PharmacyOwner');
const { JWT_SECRET } = require('../config/jwt');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

// Stable mock IDs for development
const STABLE_MOCK_PHARMACY_ID = '507f1f77bcf86cd799439011';
const STABLE_MOCK_OWNER_ID = '507f191e810c19729de160e1';

/**
 * Middleware to protect pharmacy owner routes
 */
const protectPharmacyOwner = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Development bypass for mock tokens
        const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

        // CRITICAL FIX: Only treat as mock token if it starts with 'header.' prefix
        // Real JWTs start with 'eyJ...'
        if (isDev && token.startsWith('header.')) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payloadJson = Buffer.from(parts[1], 'base64').toString();
                    const decoded = JSON.parse(payloadJson);

                    if (decoded.role === 'PHARMACY_OWNER') {
                        let owner = await PharmacyOwner.findOne({ email: decoded.email });

                        if (!owner) {
                            console.log(`[Dev] Using stable mock owner for: ${decoded.email}`);
                            owner = new PharmacyOwner({
                                _id: new mongoose.Types.ObjectId(STABLE_MOCK_OWNER_ID),
                                fullName: 'Demo Owner',
                                email: decoded.email,
                                role: 'PHARMACY_OWNER',
                                permissions: ['dashboard', 'inventory', 'orders', 'staff'],
                                isActive: true,
                                pharmacyId: new mongoose.Types.ObjectId(STABLE_MOCK_PHARMACY_ID)
                            });
                        }

                        req.owner = owner;
                        return next();
                    }
                }
            } catch (e) {
                console.warn('[Dev Auth] Mock token parsing failed:', e.message);
            }
        }

        // Standard JWT Verification
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.error('[Auth] JWT Verification failed:', err.message);
            return next(new ErrorResponse('Invalid token', 401));
        }

        const ownerId = decoded.ownerId || decoded.id;
        const owner = await PharmacyOwner.findById(ownerId);

        if (!owner) {
            console.error(`[Auth] Owner not found for ID: ${ownerId}`);
            return next(new ErrorResponse('Owner not found', 401));
        }

        if (!owner.isActive) {
            return next(new ErrorResponse('Account is deactivated', 403));
        }

        req.owner = owner;
        next();
    } catch (err) {
        console.error('[Auth] Error in protectPharmacyOwner:', err);
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

/**
 * Middleware to check specific owner permissions
 */
const authorizePermission = (permission) => {
    return (req, res, next) => {
        if (!req.owner || !req.owner.permissions || !req.owner.permissions.includes(permission)) {
            return next(new ErrorResponse(`You do not have permission to access ${permission}`, 403));
        }
        next();
    };
};

module.exports = {
    protectPharmacyOwner,
    authorizePermission
};

/**
 * Middleware to check operational permission flags (manageInventory, prepareOrders)
 * Skips check if user is NOT an owner (e.g. staff/admin)
 */
const checkOperationalPermission = (permissionKey) => {
    return (req, res, next) => {
        // If it's a staff member (req.user exists but isOwner is undefined/false), specific permissions handled by User roles
        if (req.user && !req.user.isOwner && !req.owner) {
            return next();
        }

        // If owner, check the specific operational flag
        const owner = req.owner || (req.user && req.user.isOwner ? req.user : null);

        // We need to fetch the fresh owner record if it's not fully populated on req.user
        // But req.owner from protectPharmacyOwner or updated protect() should have it.
        // Let's rely on req.owner being the full mongoose doc

        if (req.owner) {
            const hasPermission = req.owner.operationalPermissions && req.owner.operationalPermissions[permissionKey];
            if (!hasPermission) {
                return next(new ErrorResponse(`Operational Access Required: Enable '${permissionKey}' in Settings to perform this action.`, 403));
            }
        }
        next();
    };
};

module.exports = {
    protectPharmacyOwner,
    authorizePermission,
    checkOperationalPermission
};
