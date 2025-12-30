const Pharmacy = require('../models/Pharmacy');
const Subscription = require('../models/Subscription');
const { sendEmail } = require('../services/emailService');

// @desc    Get all pending pharmacy registrations
// @route   GET /api/admin/registrations
// @access  Private/Admin
const getPendingRegistrations = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const registrations = await Pharmacy.find({ status })
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Pharmacy.countDocuments({ status });

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

// @desc    Get registration details by ID
// @route   GET /api/admin/registrations/:id
// @access  Private/Admin
const getRegistrationDetails = async (req, res) => {
  try {
    const registration = await Pharmacy.findById(req.params.id).select('-password');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve a pharmacy registration
// @route   PUT /api/admin/registrations/:id/approve
// @access  Private/Admin
const approveRegistration = async (req, res) => {
  try {
    const registration = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', isActive: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Send approval email
    await sendEmail({
      to: registration.email,
      subject: 'Your Pharmacy Registration Has Been Approved',
      text: `Dear ${registration.pharmacyName},\n\nYour registration has been approved. You can now log in to your account.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject a pharmacy registration
// @route   PUT /api/admin/registrations/:id/reject
// @access  Private/Admin
const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for rejection' });
    }

    const registration = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true, runValidators: true }
    ).select('-password');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Send rejection email
    await sendEmail({
      to: registration.email,
      subject: 'Your Pharmacy Registration Has Been Rejected',
      text: `Dear ${registration.pharmacyName},\n\nWe regret to inform you that your registration has been rejected for the following reason:\n\n${reason}\n\nIf you believe this is a mistake, please contact our support team.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('pharmacy', 'pharmacyName email')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Subscription.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Activate a subscription
// @route   PUT /api/admin/subscriptions/:id/activate
// @access  Private/Admin
const activateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'active', activatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('pharmacy', 'pharmacyName email');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Send activation email
    await sendEmail({
      to: subscription.pharmacy.email,
      subject: 'Your Subscription Has Been Activated',
      text: `Dear ${subscription.pharmacy.pharmacyName},\n\nYour subscription has been activated and is now active.\n\nPlan: ${subscription.plan}\nStart Date: ${subscription.startDate}\nEnd Date: ${subscription.endDate}\n\nThank you for choosing MediLink!\n\nBest regards,\nThe MediLink Team`
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Deactivate a subscription
// @route   PUT /api/admin/subscriptions/:id/deactivate
// @access  Private/Admin
const deactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true, runValidators: true }
    ).populate('pharmacy', 'pharmacyName email');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Send deactivation email
    await sendEmail({
      to: subscription.pharmacy.email,
      subject: 'Your Subscription Has Been Deactivated',
      text: `Dear ${subscription.pharmacy.pharmacyName},\n\nYour subscription has been deactivated. You will no longer have access to premium features.\n\nIf you believe this is a mistake, please contact our support team.\n\nBest regards,\nThe MediLink Team`
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error deactivating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Renew a subscription
// @route   PUT /api/admin/subscriptions/:id/renew
// @access  Private/Admin
const renewSubscription = async (req, res) => {
  try {
    const { durationMonths } = req.body;
    
    if (!durationMonths || isNaN(durationMonths) || durationMonths < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid duration in months (minimum 1 month)' 
      });
    }

    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const currentDate = new Date();
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(durationMonths));

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        startDate: currentDate,
        endDate: newEndDate,
        isActive: true
      },
      { new: true, runValidators: true }
    ).populate('pharmacy', 'pharmacyName email');

    // Send renewal confirmation email
    await sendEmail({
      to: updatedSubscription.pharmacy.email,
      subject: 'Your Subscription Has Been Renewed',
      text: `Dear ${updatedSubscription.pharmacy.pharmacyName},\n\nYour subscription has been renewed for ${durationMonths} months.\n\nNew End Date: ${newEndDate.toLocaleDateString()}\n\nThank you for continuing with MediLink!\n\nBest regards,\nThe MediLink Team`
    });

    res.json({ success: true, data: updatedSubscription });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPendingRegistrations,
  getRegistrationDetails,
  approveRegistration,
  rejectRegistration,
  getAllSubscriptions,
  activateSubscription,
  deactivateSubscription,
  renewSubscription
};