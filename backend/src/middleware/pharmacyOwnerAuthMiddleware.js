const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PharmacyOwner = require('../models/PharmacyOwner');
const { JWT_SECRET } = require('../config/jwt');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');

/**
 * Middleware to protect pharmacy owner routes
 */
// ... imports
const protectPharmacyOwner = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Standard JWT Verification
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.error('[Auth] JWT Verification failed:', err.message);
            return next(new ErrorResponse('Invalid token', 401));
        }

        const id = decoded.userId || decoded.ownerId || decoded.id;
        // Try to find as PharmacyOwner (Legacy)
        let owner = await PharmacyOwner.findById(id);

        // If not found, try as User (New Flow)
        if (!owner) {
            const user = await User.findById(id);
            const allowedRoles = [
                'pharmacy_owner',
                'pharmacy_admin',
                'system_admin',
                'staff',
                'pharmacy_staff',
                'pharmacist',
                'technician',
                'assistant',
                'cashier'
            ];
            if (user && allowedRoles.includes(user.role)) {
                // Normalize User to look like Owner for backward compatibility where possible
                user.isUserParams = true; // Flag for controllers
                owner = user;
            }
        }

        if (!owner) {
            console.error(`[Auth] Owner/User not found for ID: ${id}`);
            return next(new ErrorResponse('Owner not found', 401));
        }

        if (owner.isActive === false) { // Check specific false, assuming true if undefined or true
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
