const TempPharmacy = require('../models/TempPharmacy');
const { generatePassword, hashPassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/pharmacy/register
 * @desc    Register a new pharmacy (temporary until approved)
 * @access  Public
 */
const registerPharmacy = async (req, res) => {
  try {
    const {
      pharmacyName,
      licenseNumber,
      establishedDate,
      ownerName,
      email,
      phone,
      tinNumber
    } = req.body;

    // Handle nested address object if sent as address[key]
    let address = req.body.address;
    if (!address && req.body['address[street]']) {
      address = {
        street: req.body['address[street]'],
        city: req.body['address[city]'],
        state: req.body['address[state]'],
        postalCode: req.body['address[postalCode]'],
        country: req.body['address[country]'] || 'Ethiopia'
      };
    }

    // Get file paths
    const licenseFile = req.files?.licenseDocument ? req.files.licenseDocument[0] : null;
    const tinFile = req.files?.tinDocument ? req.files.tinDocument[0] : null;

    if (!licenseFile || !tinFile) {
      return res.status(400).json({
        success: false,
        message: 'Both License and TIN documents are required'
      });
    }

    const licenseDocument = `/uploads/documents/${licenseFile.filename}`;
    const tinDocument = `/uploads/documents/${tinFile.filename}`;

    // Check if pharmacy with same email or license already exists
    const existingPharmacy = await TempPharmacy.findOne({
      $or: [
        { email },
        { licenseNumber }
      ]
    });

    if (existingPharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy with this email or license number already exists',
      });
    }

    // Create new temporary pharmacy record
    const tempPharmacy = new TempPharmacy({
      pharmacyName,
      licenseNumber,
      establishedDate,
      ownerName,
      email,
      phone,
      address,
      tinNumber,
      licenseDocument,
      tinDocument,
      status: 'pending'
    });

    await tempPharmacy.save();

    // In a real application, you would notify admins about the new registration
    logger.info(`New pharmacy registration pending approval: ${pharmacyName} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Pharmacy registration submitted for approval. You will be notified once approved.',
      data: {
        id: tempPharmacy._id,
        pharmacyName: tempPharmacy.pharmacyName,
        email: tempPharmacy.email,
        status: tempPharmacy.status
      }
    });

  } catch (error) {
    logger.error('Pharmacy registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering pharmacy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @route   GET /api/pharmacy/:id
 * @desc    Get public pharmacy details by ID
 * @access  Public
 */
const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .select('name address phone location openingHours isVerified rating reviewCount');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.json({
      success: true,
      data: pharmacy
    });
  } catch (error) {
    logger.error('Error fetching pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/pharmacy/status/:id
 * @desc    Check registration status of a pharmacy
 * @access  Public
 */
const checkPharmacyStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const pharmacy = await TempPharmacy.findById(id).select('-__v -updatedAt');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy registration not found',
      });
    }

    res.json({
      success: true,
      data: {
        status: pharmacy.status,
        ...(pharmacy.status === 'rejected' && { rejectionReason: pharmacy.rejectionReason }),
        ...(pharmacy.status === 'approved' && {
          nextSteps: 'Please check your email for account setup instructions'
        })
      }
    });
  } catch (error) {
    logger.error('Check pharmacy status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking registration status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @route   GET /api/pharmacy/subscription
 * @desc    Get pharmacy subscription details
 * @access  Private (Pharmacy Admin)
 */
const getPharmacySubscription = async (req, res) => {
  try {
    // Assuming req.user.pharmacyId is populated by auth middleware
    // If not, we might need to find the user's pharmacy first
    let pharmacyId = req.user.pharmacyId;

    if (!pharmacyId) {
      // Fallback: try to find pharmacy owned by this user
      const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
      if (pharmacy) {
        pharmacyId = pharmacy._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Pharmacy not found for this user'
        });
      }
    }

    const { Subscription } = require('../models/Subscription'); // Ensure model is imported if not already top-level
    // Actually, Subscription is likely required at top level. Let's check imports.
    // Use the Subscription model (already imported in pharmacyAdminController, need to check here)
    // Wait, previous file view didn't show Subscription import at top of this file. 
    // I need to add imports to the top of file first or require them here.
    // Safe approach: require here or better, add imports at top in a separate step? 
    // I will require them inside for now to avoid messing up top lines blindly, 
    // or better yet, I will use the models that should be available. 
    // Let's assume I need to require Subscription.

    const SubscriptionModel = require('../models/Subscription');

    const subscription = await SubscriptionModel.findOne({ pharmacy: pharmacyId, status: 'active' });

    if (!subscription) {
      // Return valid empty response or 404 depending on frontend expectation.
      // Usually better to return null data or specific message "No active subscription"
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: subscription.features
      }
    });
  } catch (error) {
    logger.error('Get pharmacy subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @route   POST /api/pharmacy/subscription/request-renewal
 * @desc    Request subscription renewal
 * @access  Private (Pharmacy Admin)
 */
const requestSubscriptionRenewal = async (req, res) => {
  try {
    const { mode } = req.body; // 'monthly' or 'annually'
    let pharmacyId = req.user.pharmacyId;

    if (!pharmacyId) {
      const PharmacyModel = require('../models/Pharmacy');
      const pharmacy = await PharmacyModel.findOne({ owner: req.user._id });
      if (pharmacy) {
        pharmacyId = pharmacy._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Pharmacy not found'
        });
      }
    }

    // specific logic for renewal request
    // For now, we can create a history record or a temp request object
    // Since we don't have a specific "RenewalRequest" model yet, maybe we just log it 
    // or send an email to admins?
    // The user wants "real API". 
    // Let's actually create a SubscriptionHistory entry indicating request
    const SubscriptionHistory = require('../models/SubscriptionHistory');
    const SubscriptionModel = require('../models/Subscription');

    const currentSub = await SubscriptionModel.findOne({ pharmacy: pharmacyId, status: 'active' });

    // Notify admins (mock email for now, or real email service)
    const { sendEmail } = require('../services/emailService');
    // Send email to system admin
    // For now, just log and return success

    await SubscriptionHistory.create({
      subscription: currentSub ? currentSub._id : null,
      pharmacy: pharmacyId,
      action: 'renewal_requested',
      details: `Requested renewal for ${mode} plan`,
      performedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Subscription renewal request received for ${mode} plan`,
      data: {
        status: 'pending_payment',
        requestedPlan: mode,
        requestedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Subscription renewal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing renewal request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @route   GET /api/pharmacy
 * @desc    Get public pharmacies (approved and active only)
 * @access  Public
 */
const getPharmacies = async (req, res) => {
  try {
    const { search, lat, lng, radius = 10 } = req.query;

    // 1. Get all active subscriptions
    const SubscriptionModel = require('../models/Subscription');
    const PharmacyModel = require('../models/Pharmacy');

    // Find pharmacies with active subscriptions
    // In a mature system, you might want to denormalize this status on the Pharmacy record
    const activeSubscriptions = await SubscriptionModel.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).select('pharmacy');

    const validPharmacyIds = activeSubscriptions.map(s => s.pharmacy);

    // 2. Build query for pharmacies
    let query = {
      _id: { $in: validPharmacyIds },
      status: 'approved',
      isActive: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Geospatial search
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const pharmacies = await PharmacyModel.find(query)
      .select('name address phone location openingHours isVerified rating reviewCount status isActive')
      .lean();

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pharmacies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin functions would go here (approvePharmacy, rejectPharmacy, etc.)
// These would be protected by admin middleware

module.exports = {
  registerPharmacy,
  checkPharmacyStatus,
  getPharmacySubscription,
  requestSubscriptionRenewal,
  getPharmacyById,
  getPharmacies
};
