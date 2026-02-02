const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PharmacyOwner = require('../models/PharmacyOwner');
const { JWT_SECRET } = require('../config/jwt');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');

// Stable mock IDs for development
const STABLE_MOCK_PHARMACY_ID = '65a7d5c9f1a2b3c4d5e6f701';
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

        // Standard JWT or Mock Token check
        if (isDev && token.startsWith('header.')) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payloadJson = Buffer.from(parts[1], 'base64').toString();
                    const decoded = JSON.parse(payloadJson);

                    if (decoded.role?.toLowerCase() === 'pharmacy_owner' || decoded.role?.toLowerCase() === 'pharmacy_admin') {
                        // 1. Ensure Mock Pharmacy exists first (referenced by owner)
                        let pharmacy = await Pharmacy.findById(STABLE_MOCK_PHARMACY_ID);
                        if (!pharmacy) {
                            console.log('[Dev] Creating stable mock pharmacy');
                            pharmacy = new Pharmacy({
                                _id: new mongoose.Types.ObjectId(STABLE_MOCK_PHARMACY_ID),
                                name: 'Demo Pharmacy',
                                licenseNumber: 'DEV-12345',
                                email: 'pharmacy@demo.com',
                                phone: '0911000000',
                                address: {
                                    street: 'Demo Street',
                                    city: 'Addis Ababa',
                                    state: 'Addis Ababa',
                                    zipCode: '1000',
                                    country: 'Ethiopia'
                                },
                                owner: new mongoose.Types.ObjectId(STABLE_MOCK_OWNER_ID)
                            });
                            await pharmacy.save();
                        }

                        // 2. Find or Create Mock Owner
                        let owner = await PharmacyOwner.findOne({
                            $or: [
                                { email: decoded.email },
                                { _id: STABLE_MOCK_OWNER_ID }
                            ]
                        });

                        if (!owner) {
                            console.log(`[Dev] Creating stable mock owner for: ${decoded.email}`);
                            owner = new PharmacyOwner({
                                _id: new mongoose.Types.ObjectId(STABLE_MOCK_OWNER_ID),
                                fullName: 'Demo Owner',
                                email: decoded.email,
                                role: 'pharmacy_owner',
                                phone: '0900000000',
                                password: 'password123',
                                permissions: ['dashboard', 'inventory', 'orders', 'staff'],
                                isActive: true,
                                pharmacyId: pharmacy._id
                            });
                            await owner.save();
                        } else {
                            // Ensure email matches the token if found by ID
                            if (owner.email !== decoded.email) {
                                owner.email = decoded.email;
                                await owner.save();
                            }
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
        // Staff granular permission check
        const role = req.user?.role?.toLowerCase();
        if (req.user && ['staff', 'cashier', 'pharmacist', 'technician', 'assistant', 'pharmacy_staff'].includes(role)) {
            const perms = req.user.permissions;
            if (!perms) return next(new ErrorResponse('Staff permissions not found', 403));

            if (permissionKey === 'manageInventory') {
                const inv = perms.inventory || {};
                // Determine required action based on method
                if (req.method === 'POST' && !inv.add) return next(new ErrorResponse('Permission denied: Cannot add items', 403));
                if (req.method === 'PUT' && !inv.edit) return next(new ErrorResponse('Permission denied: Cannot edit items', 403));
                if (req.method === 'DELETE' && !inv.delete) return next(new ErrorResponse('Permission denied: Cannot delete items', 403));
                // GET usually public, but if protected, check view
                if (req.method === 'GET' && !inv.view) return next(new ErrorResponse('Permission denied: Cannot view inventory', 403));
            } else if (permissionKey === 'prepareOrders') {
                const ord = perms.orders || {};
                if (req.method === 'PUT' && !ord.process) return next(new ErrorResponse('Permission denied: Cannot process orders', 403));
                // Add cancel check if route has specific path for cancel, but generic PUT logic covers process
            }
            // For other keys or if checks passed
            return next();
        }

        // If user is neither owner nor staff (should not happen if authorized correctly)
        const checkRole = req.user?.role?.toLowerCase();
        if (req.user && !req.user.isOwner && !req.owner && !['staff', 'cashier', 'pharmacist', 'technician', 'assistant', 'pharmacy_staff'].includes(checkRole)) {
            return next();
        }

        // If owner, check the specific operational flag
        const owner = req.owner || (req.user && req.user.isOwner ? req.user : null);

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
