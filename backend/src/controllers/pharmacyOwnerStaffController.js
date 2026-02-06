const User = require('../models/User');
const PharmacyStaff = require('../models/PharmacyStaff');
const PharmacyOwner = require('../models/PharmacyOwner');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create a new staff member for the pharmacy
 * @route   POST /api/pharmacy-owner/staff
 * @access  Private (Pharmacy Owner only)
 */
const createStaff = asyncHandler(async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, password, role, permissions } = req.body;
        const pharmacyId = req.owner.pharmacyId;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorResponse('A user with this email already exists', 400));
        }

        // Validate staff permissions against owner's permissions
        if (permissions) {
            const ownerPermissions = req.owner.permissions || [];
            const restrictedAreas = ['inventory', 'orders', 'customers'];

            for (const area of restrictedAreas) {
                if (permissions[area] && !ownerPermissions.includes(area)) {
                    return next(new ErrorResponse(`You do not have permission to assign ${area} access to staff`, 403));
                }
            }
        }

        // Create User record
        const user = new User({
            firstName,
            lastName,
            email,
            phone,
            password,
            role: role || 'staff',
            status: 'active',
            pharmacyId
        });

        await user.save();

        // Create PharmacyStaff record
        const pharmacyStaff = new PharmacyStaff({
            user: user._id,
            pharmacy: pharmacyId,
            role: role || 'staff',
            permissions: permissions || {
                inventory: { view: true, add: false, edit: false, delete: false },
                orders: { view: true, process: false, cancel: false },
                customers: { view: true, add: false, edit: false }
            }
        });

        await pharmacyStaff.save();

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: {
                id: pharmacyStaff._id,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                },
                role: pharmacyStaff.role,
                permissions: pharmacyStaff.permissions
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Get all staff members for the pharmacy
 * @route   GET /api/pharmacy-owner/staff
 * @access  Private (Pharmacy Owner only)
 */
const getStaff = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.owner.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('No pharmacy associated with this owner account', 400));
    }

    console.log('Fetching staff for pharmacy:', pharmacyId);

    const staff = await PharmacyStaff.find({ pharmacy: pharmacyId })
        .populate('user', 'firstName lastName email phone isActive');

    console.log(`Found ${staff.length} staff members`);

    res.json({
        success: true,
        count: staff.length,
        data: staff
    });
});

/**
 * @desc    Update staff member details
 * @route   PUT /api/pharmacy-owner/staff/:id
 * @access  Private (Pharmacy Owner only)
 */
const updateStaff = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, phone, role, permissions, isActive } = req.body;
    const staffId = req.params.id;

    const staff = await PharmacyStaff.findOne({ _id: staffId, pharmacy: req.owner.pharmacyId });
    if (!staff) {
        return next(new ErrorResponse('Staff member not found or does not belong to your pharmacy', 404));
    }

    // Update User details if provided
    if (firstName || lastName || phone) {
        await User.findByIdAndUpdate(staff.user, {
            firstName,
            lastName,
            phone
        });
    }

    if (role) staff.role = role;
    if (permissions) {
        const ownerPermissions = req.owner.permissions || [];
        const restrictedAreas = ['inventory', 'orders', 'customers'];

        for (const area of restrictedAreas) {
            if (permissions[area] && !ownerPermissions.includes(area)) {
                return next(new ErrorResponse(`You do not have permission to assign ${area} access to staff`, 403));
            }
        }
        staff.permissions = permissions;
    }
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: staff
    });
});

/**
 * @desc    Delete staff member
 * @route   DELETE /api/pharmacy-owner/staff/:id
 * @access  Private (Pharmacy Owner only)
 */
const deleteStaff = asyncHandler(async (req, res, next) => {
    try {
        const staffId = req.params.id;
        const staff = await PharmacyStaff.findOne({ _id: staffId, pharmacy: req.owner.pharmacyId });

        if (!staff) {
            return next(new ErrorResponse('Staff member not found or does not belong to your pharmacy', 404));
        }

        // Remove both user and staff record
        await User.findByIdAndDelete(staff.user);
        await PharmacyStaff.findByIdAndDelete(staffId);

        res.json({
            success: true,
            message: 'Staff member removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    createStaff,
    getStaff,
    updateStaff,
    deleteStaff
};
