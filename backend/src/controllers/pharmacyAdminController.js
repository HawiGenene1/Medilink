const User = require('../models/User');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Create a new pharmacy staff or cashier
// @route   POST /api/pharmacy-admin/staff
// @access  Private/PharmacyAdmin
exports.createStaff = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, role } = req.body;

        // Validate role
        if (!['pharmacy_staff', 'cashier'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Pharmacy Admins can only create Pharmacy Staff or Cashiers.'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // Generate random password
        const password = generatePassword(10);

        // Create new staff user
        const staff = new User({
            firstName,
            lastName,
            email,
            phone,
            role,
            status: 'pending', // Set to pending until they log in or verify? 
            // Based on guide "Staff status = INACTIVE or PENDING"
            pharmacyId: req.user.pharmacyId, // Assuming pharmacyId is in req.user
            isEmailVerified: false
        });

        // Hash password (handled by User model pre-save hook)
        staff.password = password;
        await staff.save();

        // Send welcome email with password
        try {
            await sendWelcomeEmail(email, firstName, password);
        } catch (emailError) {
            console.error('Error sending welcome email to staff:', emailError);
            // Continue even if email fails, but maybe log it
        }

        res.status(201).json({
            success: true,
            message: 'Staff account created successfully. Welcome email sent.',
            data: {
                id: staff._id,
                name: `${staff.firstName} ${staff.lastName}`,
                email: staff.email,
                role: staff.role
            }
        });

    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating staff account'
        });
    }
};

// @desc    Get all staff for current pharmacy
// @route   GET /api/pharmacy-admin/staff
// @access  Private/PharmacyAdmin
exports.getStaff = async (req, res) => {
    try {
        const staff = await User.find({
            pharmacyId: req.user.pharmacyId,
            role: { $in: ['pharmacy_staff', 'cashier'] }
        }).select('-password');

        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching staff'
        });
    }
};
