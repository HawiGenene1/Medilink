const Subscription = require('../models/Subscription');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');

// Get all subscriptions (Admin only)
exports.getSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.plan) filter.plan = req.query.plan;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('pharmacy', 'name email')
        .populate('createdBy', 'name email'),
      Subscription.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription by ID
exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('pharmacy')
      .populate('createdBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.pharmacy._id.toString() !== req.user.pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this subscription'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription by pharmacy ID
exports.getSubscriptionByPharmacy = async (req, res, next) => {
  try {
    const pharmacyId = req.params.pharmacyId || req.user.pharmacyId;
    
    const subscription = await Subscription.findOne({ pharmacy: pharmacyId })
      .sort({ createdAt: -1 })
      .populate('pharmacy', 'name email')
      .populate('createdBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for this pharmacy'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Create new subscription
exports.createSubscription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { pharmacy, plan, mode, price, trial } = req.body;

    // Check if pharmacy exists
    const pharmacyExists = await Pharmacy.findById(pharmacy);
    if (!pharmacyExists) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    // Calculate dates
    const startDate = new Date();
    let endDate = new Date();
    
    if (trial && trial.isTrial) {
      endDate.setDate(endDate.getDate() + trial.days);
    } else {
      const months = mode === 'monthly' ? 1 : 12;
      endDate.setMonth(endDate.getMonth() + months);
    }

    // Create subscription
    const subscription = new Subscription({
      pharmacy,
      plan,
      mode,
      price,
      trial: trial || { isTrial: false },
      startDate,
      endDate,
      status: trial && trial.isTrial ? 'trial' : 'active',
      createdBy: req.user.id
    });

    await subscription.save();

    // Update pharmacy subscription status
    pharmacyExists.subscriptionStatus = 'active';
    await pharmacyExists.save();

    // Send confirmation email
    try {
      await sendSubscriptionEmail(pharmacy, subscription);
    } catch (emailError) {
      console.error('Failed to send subscription email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Update subscription
exports.updateSubscription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.pharmacy.toString() !== req.user.pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subscription'
      });
    }

    // Prevent updating certain fields directly
    const { status, startDate, endDate, ...updateData } = req.body;
    
    // Only admin can update status
    if (status && req.user.role === 'admin') {
      updateData.status = status;
    }

    // Update subscription
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSubscription
    });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.pharmacy.toString() !== req.user.pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this subscription'
      });
    }

    // Update subscription status
    subscription.status = 'canceled';
    subscription.cancellation = {
      reason: req.body.reason || 'User requested cancellation',
      cancelledAt: new Date(),
      cancelledBy: req.user.id
    };

    await subscription.save();

    // Update pharmacy subscription status
    await Pharmacy.findByIdAndUpdate(subscription.pharmacy, {
      subscriptionStatus: 'inactive'
    });

    // Send cancellation email
    try {
      await sendSubscriptionCancellationEmail(subscription);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Subscription has been cancelled',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Renew subscription
exports.renewSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if subscription can be renewed
    if (subscription.status === 'active' && subscription.endDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is still active'
      });
    }

    // Calculate new end date
    const now = new Date();
    const months = subscription.mode === 'monthly' ? 1 : 12;
    const newEndDate = new Date(now);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    // Update subscription
    subscription.startDate = now;
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    subscription.renewalDate = now;
    subscription.payment.status = 'pending';
    
    await subscription.save();

    // Update pharmacy status
    await Pharmacy.findByIdAndUpdate(subscription.pharmacy, {
      subscriptionStatus: 'active'
    });

    // Send renewal confirmation
    try {
      await sendSubscriptionRenewalEmail(subscription);
    } catch (emailError) {
      console.error('Failed to send renewal email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Subscription has been renewed',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Change subscription plan
exports.changeSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan, prorate = true } = req.body;
    
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.pharmacy.toString() !== req.user.pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this subscription plan'
      });
    }

    // Get new plan details (in a real app, you'd fetch this from a plans configuration)
    const newPlan = getPlanDetails(plan);
    if (!newPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan specified'
      });
    }

    // Calculate prorated amount if needed
    let priceAdjustment = 0;
    if (prorate && subscription.status === 'active') {
      priceAdjustment = calculateProratedAmount(subscription, newPlan);
    }

    // Update subscription
    subscription.plan = plan;
    subscription.price = newPlan.price;
    subscription.features = newPlan.features;
    
    // Add to history
    subscription.history.push({
      action: 'plan_change',
      details: {
        from: subscription.plan,
        to: plan,
        priceAdjustment,
        changedAt: new Date()
      },
      changedBy: req.user.id
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription plan has been updated',
      data: {
        subscription,
        priceAdjustment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get available subscription plans
exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    // In a real app, you might fetch these from a database
    const plans = {
      Basic: {
        name: 'Basic',
        description: 'For small pharmacies with basic needs',
        price: {
          monthly: 29.99,
          annually: 299.99 // ~2 months free
        },
        features: [
          'Up to 100 products',
          'Basic reporting',
          'Email support',
          '1 user account'
        ],
        limits: {
          products: 100,
          users: 1,
          storage: '1GB',
          apiCalls: '1000/month'
        },
        isPopular: false
      },
      Standard: {
        name: 'Standard',
        description: 'For growing pharmacies with moderate needs',
        price: {
          monthly: 79.99,
          annually: 799.99 // ~2 months free
        },
        features: [
          'Up to 500 products',
          'Advanced reporting',
          'Priority email & chat support',
          'Up to 5 user accounts',
          'API access'
        ],
        limits: {
          products: 500,
          users: 5,
          storage: '10GB',
          apiCalls: '10,000/month'
        },
        isPopular: true
      },
      Premium: {
        name: 'Premium',
        description: 'For established pharmacies with advanced needs',
        price: {
          monthly: 149.99,
          annually: 1499.99 // ~2 months free
        },
        features: [
          'Unlimited products',
          'Advanced analytics & reporting',
          '24/7 priority support',
          'Up to 20 user accounts',
          'Advanced API access',
          'Custom branding',
          'Dedicated account manager'
        ],
        limits: {
          products: 'Unlimited',
          users: 20,
          storage: '50GB',
          apiCalls: '50,000/month'
        },
        isPopular: false
      },
      Enterprise: {
        name: 'Enterprise',
        description: 'Custom solutions for large pharmacy chains',
        price: {
          monthly: 'Custom',
          annually: 'Custom'
        },
        features: [
          'Unlimited everything',
          'Custom development',
          '24/7 dedicated support',
          'Unlimited user accounts',
          'Custom API integrations',
          'White-label solution',
          'On-premise deployment option',
          'Service Level Agreement (SLA)'
        ],
        limits: {
          products: 'Unlimited',
          users: 'Unlimited',
          storage: 'Custom',
          apiCalls: 'Custom'
        },
        isEnterprise: true
      }
    };

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to send subscription email
async function sendSubscriptionEmail(pharmacyId, subscription) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) return;

  const subject = 'Your Subscription is Active';
  const html = `
    <h2>Welcome to Medilink Pro!</h2>
    <p>Your ${subscription.plan} subscription is now active.</p>
    <p>Plan: ${subscription.plan} (${subscription.mode})</p>
    <p>Start Date: ${subscription.startDate.toDateString()}</p>
    <p>End Date: ${subscription.endDate.toDateString()}</p>
    <p>Thank you for choosing Medilink Pro for your pharmacy management needs.</p>
  `;

  await sendEmail(pharmacy.email, subject, html);
}

// Helper function to send subscription cancellation email
async function sendSubscriptionCancellationEmail(subscription) {
  const pharmacy = await Pharmacy.findById(subscription.pharmacy);
  if (!pharmacy) return;

  const subject = 'Your Subscription Has Been Cancelled';
  const html = `
    <h2>Subscription Cancelled</h2>
    <p>Your ${subscription.plan} subscription has been cancelled.</p>
    <p>You will have access until ${subscription.endDate.toDateString()}.</p>
    <p>Reason: ${subscription.cancellation.reason}</p>
    <p>We're sorry to see you go. If you have any feedback, we'd love to hear it.</p>
  `;

  await sendEmail(pharmacy.email, subject, html);
}

// Helper function to send subscription renewal email
async function sendSubscriptionRenewalEmail(subscription) {
  const pharmacy = await Pharmacy.findById(subscription.pharmacy);
  if (!pharmacy) return;

  const subject = 'Your Subscription Has Been Renewed';
  const html = `
    <h2>Subscription Renewed</h2>
    <p>Your ${subscription.plan} subscription has been renewed.</p>
    <p>New End Date: ${subscription.endDate.toDateString()}</p>
    <p>Thank you for continuing with Medilink Pro!</p>
  `;

  await sendEmail(pharmacy.email, subject, html);
}

// Helper function to get plan details (in a real app, this would come from a database)
function getPlanDetails(planName) {
  const plans = {
    Basic: {
      price: 29.99,
      features: ['Basic features'],
      limits: { products: 100 }
    },
    Standard: {
      price: 79.99,
      features: ['Standard features'],
      limits: { products: 500 }
    },
    Premium: {
      price: 149.99,
      features: ['Premium features'],
      limits: { products: 'Unlimited' }
    },
    Enterprise: {
      price: 'Custom',
      features: ['Enterprise features'],
      limits: { products: 'Unlimited' },
      isEnterprise: true
    }
  };

  return plans[planName];
}

// Helper function to calculate prorated amount
function calculateProratedAmount(currentSubscription, newPlan) {
  // In a real app, implement proper proration logic
  // This is a simplified example
  const daysRemaining = Math.ceil((currentSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((currentSubscription.endDate - currentSubscription.startDate) / (1000 * 60 * 60 * 24));
  const dailyRate = currentSubscription.price / totalDays;
  const credit = dailyRate * daysRemaining;
  
  // Calculate new plan cost for remaining period
  const newPlanDailyRate = newPlan.price / (newPlan.mode === 'monthly' ? 30 : 365);
  const newPlanCost = newPlanDailyRate * daysRemaining;
  
  return newPlanCost - credit;
}
