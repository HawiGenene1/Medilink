const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const PendingPharmacy = require('../models/PendingPharmacy');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

// ============ PHARMACY REGISTRATION MANAGEMENT ============

// @desc    Get all pending pharmacy registrations
// @route   GET /api/admin/registrations
// @access  Private/Admin
const getPendingRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const registrations = await PendingPharmacy.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PendingPharmacy.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: registrations
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
    const registration = await PendingPharmacy.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration has already been processed' });
    }

    // Create pharmacy from registration
    const pharmacy = new Pharmacy({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      address: registration.address,
      location: registration.location,
      owner: {
        name: registration.ownerName,
        email: registration.ownerEmail,
        phone: registration.ownerPhone
      },
      licenseNumber: registration.licenseNumber,
      documents: registration.documents,
      isVerified: true,
      isActive: true,
      approvedBy: req.user.userId,
      approvedAt: new Date(),
      approvalReason: reason || 'Approved after verification'
    });

    await pharmacy.save();

    // Update registration status
    registration.status = 'approved';
    registration.approvedBy = req.user.userId;
    registration.approvedAt = new Date();
    registration.approvalReason = reason || 'Approved after verification';
    await registration.save();

    // Send approval email
    await sendEmail({
      to: registration.email,
      subject: 'Pharmacy Registration Approved - MediLink',
      text: `Dear ${registration.ownerName},\n\nCongratulations! Your pharmacy registration has been approved.\n\nPharmacy Name: ${registration.name}\nYou can now start using the MediLink platform.\n\nBest regards,\nThe MediLink Team`
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user.userId,
      action: 'APPROVE_PHARMACY',
      resourceType: 'PHARMACY',
      resourceId: pharmacy._id,
      description: `Approved pharmacy registration: ${registration.name}`,
      status: 'SUCCESS'
    });

    res.json({ 
      success: true, 
      message: 'Pharmacy registration approved successfully', 
      data: pharmacy 
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

    const registration = await PendingPharmacy.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration has already been processed' });
    }

    // Update registration status
    registration.status = 'rejected';
    registration.rejectedBy = req.user.userId;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason;
    await registration.save();

    // Send rejection email
    await sendEmail({
      to: registration.email,
      subject: 'Pharmacy Registration Rejected - MediLink',
      text: `Dear ${registration.ownerName},\n\nWe regret to inform you that your pharmacy registration has been rejected.\n\nPharmacy Name: ${registration.name}\nReason: ${reason}\n\nYou may reapply after addressing the issues mentioned.\n\nBest regards,\nThe MediLink Team`
    });

    // Create audit log
    await AuditLog.create({
      userId: req.user.userId,
      action: 'REJECT_PHARMACY',
      resourceType: 'PHARMACY',
      resourceId: registration._id,
      description: `Rejected pharmacy registration: ${registration.name}`,
      status: 'SUCCESS'
    });

    res.json({ 
      success: true, 
      message: 'Pharmacy registration rejected successfully' 
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
  bulkExportData
};
