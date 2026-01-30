const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const PendingPharmacy = require('../models/PendingPharmacy');
const DeliveryProfile = require('../models/DeliveryProfile');
const AuditLog = require('../models/AuditLog');
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

    const fs = require('fs');
    const logMsg = `[${new Date().toISOString()}] Query: ${JSON.stringify(query)} | Found: ${pendingUsers.length}\n`;
    try {
      fs.appendFileSync('debug-logs.txt', logMsg);
      pendingUsers.forEach(u => {
        fs.appendFileSync('debug-logs.txt', ` - ${u.firstName} ${u.lastName} (${u.email}) [${u.role}]\n`);
      });
    } catch (e) { console.error(e); }

    console.log('[Admin] Fetching pending. Query:', query);
    console.log('[Admin] Found users:', pendingUsers.length);
    pendingUsers.forEach(u => console.log(` - ${u.firstName} ${u.lastName} (${u.email}) [${u.role}]`));

    const data = await Promise.all(pendingUsers.map(async (user) => {
      let details = null;
      if (user.role === 'pharmacy_admin') {
        details = await PendingPharmacy.findOne({ userId: user._id });
      } else if (user.role === 'delivery') {
        details = await DeliveryProfile.findOne({ userId: user._id });
        // Show all pending delivery users, even if they haven't finished onboarding
        if (!details) {
          details = { onboardingStatus: 'not_started' };
        }
      }
      return {
        ...user.toObject(),
        applicationDetails: details
      };
    }));

    // Filter out nulls from skipped delivery users
    const filteredData = data.filter(item => item !== null);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      count: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit),
      currentPage: page,
      data: filteredData
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
      const registration = await DeliveryProfile.findOne({ userId: user._id });
      if (registration) {
        registration.onboardingStatus = 'approved';
        registration.reviewedAt = new Date();
        registration.reviewerNotes = reason || 'Approved after verification';
        await registration.save();
      }
    }

    // Prepare success response early but don't send yet
    result = result || user;

    // Send SINGLE Activation Email
    const emailHtml = `
        <h3>Congratulations, ${user.firstName}!</h3>
        <p>Your application to become a MediLink ${user.role === 'delivery' ? 'Delivery Partner' : 'Pharmacy Admin'} has been <strong>APPROVED</strong>.</p>
        <p>You can now log in to your dashboard and start using the platform.</p>
        <p>Welcome to the team!</p>
    `;

    // We do one email call here.
    try {
      await sendEmail(user.email, 'MediLink Account Activated', emailHtml);
    } catch (err) {
      console.error('Email failed but proceeding with activation:', err);
    }

    // Update user status LAST to ensure retries work if we fail before this
    user.status = 'active';
    user.isEmailVerified = true;
    await user.save();

    res.json({
      success: true,
      message: `${user.role} approved successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during approval',
      error: error.message,
      stack: error.stack
    });
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
      const registration = await DeliveryProfile.findOne({ userId: user._id });
      if (registration) {
        registration.onboardingStatus = 'rejected';
        registration.reviewedAt = new Date();
        registration.reviewerNotes = reason;
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

    if (status) {
      query.status = status;
    } else {
      // By default, don't show rejected users in the main user list
      query.status = { $ne: 'rejected' };
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
    console.error('Error fetching user:', error);
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
      case 'orders':
        // Add Order model import and export logic
        data = [];
        filename = `orders_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'medicines':
        // Add Medicine model import and export logic
        data = [];
        filename = `medicines_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'audit_logs':
        data = await AuditLog.find(filters).sort({ createdAt: -1 });
        filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Allowed types: users, pharmacies, orders, medicines, audit_logs'
        });
    }

    if (format === 'csv') {
      // Convert to CSV logic here
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      // CSV conversion logic would go here
      res.send('CSV export not implemented yet');
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

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const pharmacyAdmins = await User.countDocuments({ role: 'pharmacy_admin' });
    const deliveryPersons = await User.countDocuments({ role: 'delivery' });

    // Inactive/Active users
    const activeUsers = await User.countDocuments({ isActive: true });

    // Pharmacies
    const activePharmacies = await Pharmacy.countDocuments({ isActive: true });
    const totalPharmacies = await Pharmacy.countDocuments();

    // Stats from Order model
    const Order = require('../models/Order');
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    const revenueRes = await Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const revenueMonth = revenueRes.length > 0 ? revenueRes[0].total : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          customers,
          pharmacyAdmins,
          deliveryPersons,
          activeUsers,
          activePharmacies,
          totalPharmacies,
          ordersToday,
          revenueMonth,
          healthScore: 100 // System is healthy
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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

  // Bulk operations
  bulkCreateUsers,
  bulkUpdateUsers,
  bulkDeleteUsers,
  bulkBlockPharmacies,
  bulkApprovePharmacies,
  bulkExportData,
  createDeliveryPerson,
  getDashboardStats
};
