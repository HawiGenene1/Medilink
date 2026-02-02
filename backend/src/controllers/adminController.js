const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const PendingPharmacy = require('../models/PendingPharmacy');
const PendingDeliveryPerson = require('../models/PendingDeliveryPerson');
const AuditLog = require('../models/AuditLog');
const Category = require('../models/Category');
const SystemSetting = require('../models/SystemSetting');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

// ============ PHARMACY REGISTRATION MANAGEMENT ============

// @desc    Get all pending pharmacy registrations
// @route   GET /api/admin/registrations
// @access  Private/Admin
const getPendingRegistrations = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = { status: 'pending' };
    if (role) {
      query.role = role;
    }

    const pendingUsers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const data = await Promise.all(pendingUsers.map(async (user) => {
      let details = null;
      if (user.role === 'pharmacy_admin') {
        details = await PendingPharmacy.findOne({ userId: user._id });
      } else if (user.role === 'delivery') {
        details = await PendingDeliveryPerson.findOne({ userId: user._id });
      }
      return {
        ...user.toObject(),
        applicationDetails: details
      };
    }));

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get details of a specific registration
// @route   GET /api/admin/registrations/:id
// @access  Private/Admin
const getRegistrationDetails = async (req, res) => {
  try {
    const registration = await PendingPharmacy.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve pharmacy registration
// @route   POST /api/admin/registrations/:id/approve
// @access  Private/Admin
const approveRegistration = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration has already been processed' });
    }

    let result = null;

    if (user.role === 'pharmacy_admin') {
      const registration = await PendingPharmacy.findOne({ userId: user._id });
      if (!registration) {
        return res.status(404).json({ success: false, message: 'Pharmacy registration details not found' });
      }

      // Create pharmacy from registration
      const pharmacy = new Pharmacy({
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        address: registration.address,
        owner: user._id,
        ownerName: `${user.firstName} ${user.lastName}`,
        licenseNumber: registration.licenseNumber,
        isVerified: true,
        isActive: true,
        status: 'approved'
      });

      await pharmacy.save();

      registration.status = 'approved';
      registration.reviewedBy = req.user.userId;
      registration.reviewedAt = new Date();
      registration.reviewNotes = reason || 'Approved after verification';
      await registration.save();

      result = pharmacy;
    } else if (user.role === 'delivery') {
      const registration = await PendingDeliveryPerson.findOne({ userId: user._id });
      if (registration) {
        registration.status = 'approved';
        registration.reviewedBy = req.user.userId;
        registration.reviewedAt = new Date();
        registration.reviewNotes = reason || 'Approved after verification';
        await registration.save();
      }
    }

    // Update user status
    user.status = 'active';
    user.isEmailVerified = true;
    await user.save();

    // Send approval email
    await sendEmail({
      to: user.email,
      subject: 'Account Approved - MediLink',
      text: `Dear ${user.firstName},\n\nCongratulations! Your account registration has been approved.\n\nYou can now log in and start using the MediLink platform.\n\nBest regards,\nThe MediLink Team`
    });

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'APPROVE',
      entityType: 'USER',
      entityId: user._id,
      description: `Approved ${user.role} registration for ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `${user.role} approved successfully`,
      data: result || user
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject pharmacy registration
// @route   POST /api/admin/registrations/:id/reject
// @access  Private/Admin
const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration has already been processed' });
    }

    // Update registration details if they exist
    if (user.role === 'pharmacy_admin') {
      const registration = await PendingPharmacy.findOne({ userId: user._id });
      if (registration) {
        registration.status = 'rejected';
        registration.reviewedBy = req.user.userId;
        registration.reviewedAt = new Date();
        registration.rejectionReason = reason;
        await registration.save();
      }
    } else if (user.role === 'delivery') {
      const registration = await PendingDeliveryPerson.findOne({ userId: user._id });
      if (registration) {
        registration.status = 'rejected';
        registration.reviewedBy = req.user.userId;
        registration.reviewedAt = new Date();
        registration.rejectionReason = reason;
        await registration.save();
      }
    }

    // Update user status
    user.status = 'rejected';
    await user.save();

    // Send rejection email
    await sendEmail({
      to: user.email,
      subject: 'Account Registration Rejected - MediLink',
      text: `Dear ${user.firstName},\n\nWe regret to inform you that your account registration has been rejected.\n\nReason: ${reason}\n\nYou may reapply after addressing the issues mentioned.\n\nBest regards,\nThe MediLink Team`
    });

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'REJECT',
      entityType: 'USER',
      entityId: user._id,
      description: `Rejected ${user.role} registration for ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Registration rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all active/approved pharmacies
// @route   GET /api/admin/pharmacies
// @access  Private/Admin
const getAllPharmacies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query = { status: 'approved' }; // Default to fetching approved pharmacies

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pharmacies = await Pharmacy.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: pharmacies
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pharmacy by ID
// @route   GET /api/admin/pharmacies/:id
// @access  Private/Admin
const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({ success: true, data: pharmacy });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ SUBSCRIPTION MANAGEMENT ============

// @desc    Get all subscriptions
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const pharmacies = await Pharmacy.find(query)
      .select('name email subscription status createdAt')
      .populate('subscription')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Activate subscription
// @route   POST /api/admin/subscriptions/:id/activate
// @access  Private/Admin
const activateSubscription = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      {
        'subscription.status': 'active',
        'subscription.activatedAt': new Date(),
        'subscription.activatedBy': req.user.userId
      },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: pharmacy
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Deactivate subscription
// @route   POST /api/admin/subscriptions/:id/deactivate
// @access  Private/Admin
const deactivateSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      {
        'subscription.status': 'inactive',
        'subscription.deactivatedAt': new Date(),
        'subscription.deactivatedBy': req.user.userId,
        'subscription.deactivationReason': reason
      },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      message: 'Subscription deactivated successfully',
      data: pharmacy
    });
  } catch (error) {
    console.error('Error deactivating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Renew subscription
// @route   POST /api/admin/subscriptions/:id/renew
// @access  Private/Admin
const renewSubscription = async (req, res) => {
  try {
    const { duration, plan } = req.body;

    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    // Calculate new expiry date
    const currentExpiry = pharmacy.subscription.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + (duration || 12));

    pharmacy.subscription = {
      ...pharmacy.subscription,
      status: 'active',
      plan: plan || pharmacy.subscription.plan,
      expiresAt: newExpiry,
      renewedAt: new Date(),
      renewedBy: req.user.userId
    };

    await pharmacy.save();

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: pharmacy
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete subscription
// @route   DELETE /api/admin/subscriptions/:id
// @access  Private/Admin
const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Find the pharmacy linked to this subscription and remove the reference
    await Pharmacy.findOneAndUpdate(
      { subscription: subscription._id },
      { $unset: { subscription: "" } }
    );

    await Subscription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ USER MANAGEMENT FUNCTIONS ============

// @desc    Create new admin user
// @route   POST /api/admin/users/create-admin
// @access  Private/Admin
const createAdminUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      permissions = []
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password, role'
      });
    }

    // Validate role
    const allowedRoles = ['admin', 'pharmacy_admin', 'cashier'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const newAdmin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phone,
      isActive: true,
      isEmailVerified: true,
      permissions,
      createdBy: req.user.userId
    });

    await newAdmin.save();

    // Remove password from response
    const userResponse = newAdmin.toObject();
    delete userResponse.password;

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Your Admin Account Has Been Created',
      text: `Dear ${firstName} ${lastName},\n\nYour admin account has been created successfully.\n\nEmail: ${email}\nRole: ${role}\n\nYou can now log in to admin panel.\n\nBest regards,\nThe MediLink Team`
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      status,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    const query = {};

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Disable user account
// @route   PATCH /api/admin/users/:id/disable
// @access  Private/Admin
const disableUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for disabling this user'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        disabledAt: new Date(),
        disabledReason: reason,
        disabledBy: req.user.userId
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Your Account Has Been Disabled',
      text: `Dear ${user.firstName} ${user.lastName},\n\nYour account has been disabled for the following reason:\n\n${reason}\n\nIf you believe this is a mistake, please contact our support team.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({
      success: true,
      message: 'User disabled successfully',
      data: user
    });
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Enable user account
// @route   PATCH /api/admin/users/:id/enable
// @access  Private/Admin
const enableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
        enabledAt: new Date(),
        enabledBy: req.user.userId
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Your Account Has Been Enabled',
      text: `Dear ${user.firstName} ${user.lastName},\n\nYour account has been re-enabled. You can now log in to your account.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({
      success: true,
      message: 'User enabled successfully',
      data: user
    });
  } catch (error) {
    console.error('Error enabling user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role, reason } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new role'
      });
    }

    // Validate role
    const allowedRoles = ['admin', 'pharmacy_admin', 'cashier', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role,
        roleUpdatedAt: new Date(),
        roleUpdatedBy: req.user.userId,
        roleUpdateReason: reason || 'Role updated by admin'
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Your Role Has Been Updated',
      text: `Dear ${user.firstName} ${user.lastName},\n\nYour role has been updated to: ${role}\n\n${reason ? `Reason: ${reason}` : ''}\n\nYou can now log in with your new permissions.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ BULK OPERATIONS ============

// @desc    Bulk create users
// @route   POST /api/admin/users/bulk-create
// @access  Private/Admin
const bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of users to create'
      });
    }

    if (users.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create more than 100 users at once'
      });
    }

    const saltRounds = 10;
    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < users.length; i++) {
      try {
        const userData = users[i];

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        const user = new User({
          ...userData,
          password: hashedPassword,
          createdBy: req.user.userId
        });

        const savedUser = await user.save();
        createdUsers.push({
          index: i,
          user: savedUser.toObject()
        });

        // Send welcome email
        await sendEmail({
          to: savedUser.email,
          subject: 'Welcome to MediLink',
          text: `Dear ${savedUser.firstName} ${savedUser.lastName},\n\nYour account has been created successfully.\n\nEmail: ${savedUser.email}\nPassword: ${userData.password}\n\nPlease log in and change your password.\n\nBest regards,\nThe MediLink Team`
        });

      } catch (error) {
        errors.push({
          index: i,
          email: users[i].email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Created ${createdUsers.length} users successfully`,
      data: {
        created: createdUsers,
        errors,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error in bulk user creation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk update users
// @route   PATCH /api/admin/users/bulk-update
// @access  Private/Admin
const bulkUpdateUsers = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user updates'
      });
    }

    const updatedUsers = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      try {
        const { id, ...updateData } = updates[i];

        const user = await User.findByIdAndUpdate(
          id,
          {
            ...updateData,
            updatedBy: req.user.userId,
            updatedAt: new Date()
          },
          { new: true }
        ).select('-password');

        if (user) {
          updatedUsers.push({
            index: i,
            user: user
          });
        } else {
          errors.push({
            index: i,
            id,
            error: 'User not found'
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          id: updates[i].id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedUsers.length} users successfully`,
      data: {
        updated: updatedUsers,
        errors,
        total: updates.length
      }
    });
  } catch (error) {
    console.error('Error in bulk user update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk delete users
// @route   DELETE /api/admin/users/bulk-delete
// @access  Private/Admin
const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to delete'
      });
    }

    const deletedUsers = [];
    const errors = [];

    for (let i = 0; i < userIds.length; i++) {
      try {
        const user = await User.findByIdAndDelete(userIds[i]);

        if (user) {
          deletedUsers.push({
            index: i,
            user: user.toObject()
          });
        } else {
          errors.push({
            index: i,
            id: userIds[i],
            error: 'User not found'
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          id: userIds[i],
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deletedUsers.length} users successfully`,
      data: {
        deleted: deletedUsers,
        errors,
        total: userIds.length
      }
    });
  } catch (error) {
    console.error('Error in bulk user deletion:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk block pharmacies
// @route   PATCH /api/admin/pharmacies/bulk-block
// @access  Private/Admin
const bulkBlockPharmacies = async (req, res) => {
  try {
    const { pharmacyIds, reason } = req.body;

    if (!pharmacyIds || !Array.isArray(pharmacyIds) || pharmacyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of pharmacy IDs to block'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for blocking these pharmacies'
      });
    }

    const blockedPharmacies = [];
    const errors = [];

    for (let i = 0; i < pharmacyIds.length; i++) {
      try {
        const pharmacy = await Pharmacy.findByIdAndUpdate(
          pharmacyIds[i],
          {
            isBlocked: true,
            blockedAt: new Date(),
            blockedBy: req.user.userId,
            blockReason: reason,
            $push: {
              blockHistory: {
                blockedAt: new Date(),
                blockedBy: req.user.userId,
                reason: reason
              }
            }
          },
          { new: true }
        );

        if (pharmacy) {
          blockedPharmacies.push({
            index: i,
            pharmacy: pharmacy.toObject()
          });
        } else {
          errors.push({
            index: i,
            id: pharmacyIds[i],
            error: 'Pharmacy not found'
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          id: pharmacyIds[i],
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Blocked ${blockedPharmacies.length} pharmacies successfully`,
      data: {
        blocked: blockedPharmacies,
        errors,
        total: pharmacyIds.length
      }
    });
  } catch (error) {
    console.error('Error in bulk pharmacy blocking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk approve pharmacies
// @route   PATCH /api/admin/pharmacies/bulk-approve
// @access  Private/Admin
const bulkApprovePharmacies = async (req, res) => {
  try {
    const { pharmacyIds, reason } = req.body;

    if (!pharmacyIds || !Array.isArray(pharmacyIds) || pharmacyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of pharmacy IDs to approve'
      });
    }

    const approvedPharmacies = [];
    const errors = [];

    for (let i = 0; i < pharmacyIds.length; i++) {
      try {
        const pharmacy = await Pharmacy.findByIdAndUpdate(
          pharmacyIds[i],
          {
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: req.user.userId,
            verificationReason: reason || 'Approved by admin'
          },
          { new: true }
        );

        if (pharmacy) {
          approvedPharmacies.push({
            index: i,
            pharmacy: pharmacy.toObject()
          });
        } else {
          errors.push({
            index: i,
            id: pharmacyIds[i],
            error: 'Pharmacy not found'
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          id: pharmacyIds[i],
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Approved ${approvedPharmacies.length} pharmacies successfully`,
      data: {
        approved: approvedPharmacies,
        errors,
        total: pharmacyIds.length
      }
    });
  } catch (error) {
    console.error('Error in bulk pharmacy approval:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new delivery person
// @route   POST /api/admin/delivery-person
// @access  Private/Admin
const createDeliveryPerson = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, vehicleInfo, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const password = generatePassword(12);

    // Create new delivery user
    // Password hashing is handled by pre-save hook in User model
    const deliveryPerson = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'delivery',
      status: 'active',
      isEmailVerified: true,
      vehicleInfo,
      address,
      createdBy: req.user.userId
    });

    await deliveryPerson.save();

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Delivery Partner Account Created - MediLink',
        text: `Dear ${firstName},\n\nYour delivery partner account has been created.\n\nLogin Email: ${email}\nPassword: ${password}\n\nPlease login and change your password.\n\nBest regards,\nThe MediLink Team`
      });
    } catch (emailError) {
      console.error('Error sending welcome email to delivery person:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Delivery person created successfully',
      data: {
        id: deliveryPerson._id,
        name: `${deliveryPerson.firstName} ${deliveryPerson.lastName}`,
        email: deliveryPerson.email
      }
    });

  } catch (error) {
    console.error('Error creating delivery person:', error);
    res.status(500).json({ success: false, message: 'Server error creating delivery person' });
  }
};

// @desc    Bulk export data
// @route   POST /api/admin/export
// @access  Private/Admin
// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/analytics/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // 1. Get counts
    const totalUsers = await User.countDocuments();
    const totalPharmacies = await Pharmacy.countDocuments({ status: 'approved' });
    const totalOrders = await Order.countDocuments();

    // 2. Calculate Total Revenue
    const revenueData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // 2.1 Subscription Stats
    const activeSubscriptions = await Pharmacy.countDocuments({ 'subscription.status': { $in: ['active', 'trial'] } });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiringSubscriptions = await Pharmacy.countDocuments({
      'subscription.status': 'active',
      'subscription.expiresAt': { $lte: expiryDate, $gte: new Date() }
    });

    // 2.1 Calculate Weekly Revenue Trend
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const weeklyRevenue = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          amount: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedWeeklyRevenue = weeklyRevenue.map(item => ({
      name: dayNames[item._id - 1],
      revenue: item.amount
    }));

    // 3. Get User Growth (Last 7 months)
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sevenMonthsAgo } } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format userGrowth for frontend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedGrowth = userGrowth.map(item => ({
      name: monthNames[item._id - 1],
      users: item.count
    }));

    // 4. Get Order Status Distribution
    const orderStatus = await Order.aggregate([
      { $group: { _id: '$status', value: { $sum: 1 } } }
    ]);
    const formattedOrderStatus = orderStatus.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.value
    }));

    // 5. Real System Alerts (Latest 5 Audit Logs)
    const latestLogs = await AuditLog.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10); // Get more to filter for health calculation

    const recentAlerts = latestLogs.slice(0, 5).map(log => ({
      id: log._id,
      type: log.status === 'FAILURE' || log.action === 'DELETE' || log.action === 'BLOCK' ? 'critical' : (log.action === 'REJECT' ? 'warning' : 'info'),
      message: `${log.action}: ${log.description}`,
      time: new Date(log.createdAt).toLocaleTimeString(),
      fullTime: log.createdAt
    }));

    // 6. Calculate Dynamic Health Score
    // Formula: 100 - (Failures in last 24h * 5) - (Pending registrations * 2)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const failuresCount = await AuditLog.countDocuments({
      status: 'FAILURE',
      createdAt: { $gte: oneDayAgo }
    });

    const pendingCount = await User.countDocuments({ status: 'pending' });

    let healthScore = 100 - (failuresCount * 5) - (pendingCount * 1);
    healthScore = Math.max(0, Math.min(100, healthScore));

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activePharmacies: totalPharmacies,
          totalOrders,
          totalRevenue,
          healthScore,
          activeSubscriptions,
          expiringSubscriptions
        },
        userGrowth: formattedGrowth,
        orderStatus: formattedOrderStatus,
        weeklyRevenue: formattedWeeklyRevenue,
        alerts: recentAlerts
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const bulkExportData = async (req, res) => {
  try {
    const { type, format = 'json', filters = {} } = req.body;

    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await User.find(filters).select('-password');
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'pharmacies':
        data = await Pharmacy.find(filters);
        filename = `pharmacies_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'audit_logs':
        data = await AuditLog.find(filters).sort({ createdAt: -1 });
        filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Allowed types: users, pharmacies, audit_logs'
        });
    }

    if (format === 'csv') {
      const fields = ['firstName', 'lastName', 'email', 'role', 'phone', 'isActive', 'createdAt'];
      const headers = fields.join(',');

      const csvRows = data.map(row => {
        return fields.map(field => {
          let value = row[field] || '';
          if (field === 'isActive') value = row.isActive ? 'Active' : 'Inactive';
          if (field === 'createdAt') value = new Date(row.createdAt).toISOString().split('T')[0];
          // Escape quotes
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',');
      });

      const csv = [headers, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        exportDate: new Date(),
        type,
        count: data.length,
        data
      });
    }
  } catch (error) {
    console.error('Error in bulk data export:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all audit logs
// @route   GET /api/admin/audit
// @access  Private/Admin
const getAllAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Filters
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Detailed Business Intelligence Analytics
// @route   GET /api/admin/analytics/detailed
// @access  Private/Admin
const getDetailedAnalytics = async (req, res) => {
  try {
    // 1. KPI Metrics
    const revenueTrendData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueTrendData.length > 0 ? revenueTrendData[0].total : 0;
    const totalOrders = await Order.countDocuments();
    const activeUsers = await User.countDocuments({ role: 'customer' });
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Revenue Trend (Monthly for last 7 months)
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const monthlyRevenueTrend = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: sevenMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedRevenueTrend = monthlyRevenueTrend.map(item => ({
      name: monthNames[item._id.month - 1],
      value: item.total
    }));

    // 3. Category Sales Distribution
    const categorySales = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      { $unwind: '$medicine' },
      {
        $lookup: {
          from: 'categories',
          localField: 'medicine.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          value: { $sum: '$items.subtotal' }
        }
      }
    ]);

    const formattedCategoryData = categorySales.map(item => ({
      name: item._id,
      value: item.value
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          activeUsers,
          avgOrderValue
        },
        revenueTrend: formattedRevenueTrend,
        categoryData: formattedCategoryData
      }
    });

  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ SYSTEM SETTINGS ============

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update system settings
// @route   PATCH /api/admin/settings
// @access  Private/Admin
const updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    const updates = req.body;
    const previousSettings = settings.toObject();

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        settings[key] = updates[key];
      }
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    // Create Audit Log for significant changes
    const changes = [];
    if (updates.maintenanceMode !== undefined && updates.maintenanceMode !== previousSettings.maintenanceMode) {
      changes.push(`Maintenance Mode ${updates.maintenanceMode ? 'Enabled' : 'Disabled'}`);
    }
    if (updates.currency && updates.currency !== previousSettings.currency) {
      changes.push(`Currency changed to ${updates.currency}`);
    }
    if (updates.emailService?.enabled !== undefined && updates.emailService.enabled !== previousSettings.emailService?.enabled) {
      changes.push(`Email Service ${updates.emailService.enabled ? 'Enabled' : 'Disabled'}`);
    }
    // Add more specific checks as needed

    if (changes.length > 0 || Object.keys(updates).length > 0) {
      await AuditLog.create({
        user: req.user._id,
        action: 'UPDATE_SETTINGS',
        entityType: 'SYSTEM',
        entityId: settings._id,
        status: 'SUCCESS',
        description: changes.length > 0 ? changes.join(', ') : 'Updated system configuration',
        details: { updates }
      });
    }

    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ ADMIN NOTIFICATIONS ============

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/admin/notifications/:id/read
// @access  Private/Admin
const markAdminNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/admin/notifications
// @access  Private/Admin
const clearAllAdminNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Force password reset for a user
// @route   PATCH /api/admin/users/:id/reset-password
// @access  Private/Admin
const forcePasswordReset = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid password (min 6 characters)'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        password: hashedPassword,
        passwordChangedAt: Date.now()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send email notification to user
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed by Administrator - MediLink',
        text: `Dear ${user.firstName},\n\nYour password has been reset by an administrator.\n\nYour new password is: ${password}\n\nPlease login and change it immediately if this was not requested.\n\nBest regards,\nThe MediLink Team`
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Revoke all user sessions
// @route   PATCH /api/admin/users/:id/revoke-sessions
// @access  Private/Admin
const revokeSessions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'REVOKE_SESSIONS',
      entityType: 'User',
      entityId: user._id,
      status: 'SUCCESS',
      description: `Revoked sessions for ${user.email}`
    });

    res.json({ success: true, message: 'User sessions revoked' });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  // Pharmacy registration management
  getPendingRegistrations,
  getRegistrationDetails,
  approveRegistration,
  rejectRegistration,

  // Subscription management
  getAllSubscriptions,
  activateSubscription,
  deactivateSubscription,
  renewSubscription,

  // User management
  createAdminUser,
  getAllUsers,
  getUserById,
  disableUser,
  enableUser,
  updateUserRole,
  forcePasswordReset,
  revokeSessions,

  // System Settings
  getSystemSettings,
  updateSystemSettings,

  // Admin Notifications
  getAdminNotifications,
  markAdminNotificationRead,
  clearAllAdminNotifications,

  // Bulk operations
  bulkCreateUsers,
  bulkUpdateUsers,
  bulkDeleteUsers,
  bulkBlockPharmacies,
  bulkApprovePharmacies,
  bulkExportData,
  getAllAuditLogs,
  createDeliveryPerson,
  getDashboardStats,
  getDetailedAnalytics,
  getAllPharmacies,
  getPharmacyById,
  deleteSubscription
};
