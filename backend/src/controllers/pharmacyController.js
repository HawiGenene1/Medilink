const TempPharmacy = require('../models/TempPharmacy');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
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
      address,
      tinNumber
    } = req.body;

    console.log('[DEBUG] Registration body received:', { ...req.body, address: typeof address });

    // 1. Robust Address Parsing (FormData often flattens objects differently depending on browser/version)
    let finalAddress = {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    };

    if (typeof address === 'string') {
      try {
        finalAddress = JSON.parse(address);
      } catch (e) {
        // Fallback if it's just a string like "[object Object]"
        finalAddress.street = req.body['address[street]'] || req.body.street || '';
        finalAddress.city = req.body['address[city]'] || req.body.city || '';
        finalAddress.state = req.body['address[state]'] || req.body.state || '';
        finalAddress.postalCode = req.body['address[postalCode]'] || req.body.postalCode || '';
      }
    } else if (typeof address === 'object' && address !== null) {
      finalAddress = {
        street: address.street || req.body['address[street]'] || '',
        city: address.city || req.body['address[city]'] || '',
        state: address.state || req.body['address[state]'] || '',
        postalCode: address.postalCode || req.body['address[postalCode]'] || ''
      };
    } else {
      // Direct field access as last resort
      finalAddress.street = req.body['address[street]'] || req.body.street || '';
      finalAddress.city = req.body['address[city]'] || req.body.city || '';
      finalAddress.state = req.body['address[state]'] || req.body.state || '';
      finalAddress.postalCode = req.body['address[postalCode]'] || req.body.postalCode || '';
    }

    // 2. Safe Date Parsing
    const parsedDate = establishedDate ? new Date(establishedDate) : new Date();

    // 3. Extract Document Paths
    const licenseDoc = req.files?.licenseDocument ? req.files.licenseDocument[0].path : 'pending';
    const tinDoc = req.files?.tinDocument ? req.files.tinDocument[0].path : 'pending';

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

    // Development mode bypass: Auto-approve pharmacies
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      logger.info(`[DEV MODE] Auto-approving pharmacy: ${pharmacyName}`);
    }

    // Create new temporary pharmacy record
    const tempPharmacy = new TempPharmacy({
      pharmacyName,
      licenseNumber,
      establishedDate: parsedDate,
      ownerName,
      email,
      phone,
      address: finalAddress,
      tinNumber,
      licenseDocument: licenseDoc,
      tinDocument: tinDoc,
      status: isDev ? 'approved' : 'pending',
      approvalStatus: isDev ? 'APPROVED' : 'PENDING'
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
        status: tempPharmacy.status,
        approvalStatus: tempPharmacy.approvalStatus
      }
    });

  } catch (error) {
    logger.error('Pharmacy registration error:', error);

    // Detailed validation error handling
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: message
      });
    }

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
    // In a real implementation, you would get the pharmacy ID from the authenticated user
    // For now, we'll use a placeholder response
    res.json({
      success: true,
      data: {
        plan: 'basic',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        features: [
          'inventory_management',
          'sales_tracking',
          'basic_reporting'
        ]
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
    const { mode = 'monthly' } = req.body;

    // In a real implementation, you would process the renewal request here
    // This is just a placeholder response
    res.status(200).json({
      success: true,
      message: `Subscription renewal request received for ${mode} plan`,
      data: {
        requestId: `sub_req_${Date.now()}`,
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

// Admin functions would go here (approvePharmacy, rejectPharmacy, etc.)
// These would be protected by admin middleware

/**
 * @route   GET /api/pharmacy
 * @desc    Get list of verified pharmacies with optional filtering
 * @access  Public
 */
const getPharmacies = async (req, res) => {
  try {
    const { search, lat, lng, radius = 5, medicine } = req.query;
    const query = { status: 'approved', isActive: true };

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Medicine Search Filter
    if (medicine) {
      // Find medicines with matching name that are in stock
      const medicines = await Medicine.find({
        name: { $regex: medicine, $options: 'i' },
        quantity: { $gt: 0 }
      }).select('pharmacy');

      const pharmacyIds = medicines.map(m => m.pharmacy);
      query._id = { $in: pharmacyIds };
    }

    // Geospatial query
    if (lat && lng) {
      const radiusInRadians = radius / 6378.1; // Earth radius ~6378km
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
        }
      };
    }

    const pharmacies = await Pharmacy.find(query)
      .select('name address phone location rating reviewCount openingHours status')
      .lean();

    // Calculate distance if user location is provided (for sorting/display manually if needed)
    // Note: $geoWithin doesn't return calculated distance field like $near does, 
    // but $near requires specific index setup. sticking to simple filtering for now.

    res.json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacies',
      error: error.message
    });
  }
};

module.exports = {
  registerPharmacy,
  checkPharmacyStatus,
  getPharmacySubscription,
  requestSubscriptionRenewal,
  getPharmacyById,
  getPharmacies
};