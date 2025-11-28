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
      address,
      tinNumber,
      licenseDocument,
      tinDocument
    } = req.body;

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

// Admin functions would go here (approvePharmacy, rejectPharmacy, etc.)
// These would be protected by admin middleware

module.exports = {
  registerPharmacy,
  checkPharmacyStatus
};