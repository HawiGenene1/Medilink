const DeliveryProfile = require('../models/DeliveryProfile');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @route   GET /api/delivery/onboarding/status
 * @desc    Get current onboarding progress for the user
 * @access  Private
 */
const getOnboardingStatus = async (req, res) => {
    try {
        let profile = await DeliveryProfile.findOne({ userId: req.user.userId || req.user.id });

        if (!profile) {
            // Initial profile creation if not exists
            profile = await DeliveryProfile.create({ userId: req.user.userId || req.user.id });
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        logger.error('Error fetching onboarding status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch onboarding status',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/delivery/onboarding/step
 * @desc    Save data for a specific onboarding step
 * @access  Private
 */
const saveOnboardingStep = async (req, res) => {
    try {
        const { step } = req.body;
        const userId = req.user.userId || req.user.id;
        let profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            profile = new DeliveryProfile({ userId });
        }

        // Parse Step-specific data
        const stepData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {});

        switch (parseInt(step)) {
            case 2: // Personal Information
                profile.personalDetails = {
                    dateOfBirth: stepData.dateOfBirth,
                    residentialAddress: stepData.residentialAddress,
                    preferredLanguage: stepData.preferredLanguage,
                    emergencyContact: stepData.emergencyContact
                };
                break;

            case 3: // Vehicle Selection
                profile.vehicleDetails = {
                    vehicleType: stepData.type,
                    make: stepData.make,
                    model: stepData.model,
                    year: stepData.year,
                    color: stepData.color,
                    licensePlate: stepData.licensePlate
                };
                break;

            case 4: // Documents
                // Files are handled via Multer and available in req.files
                if (req.files) {
                    if (req.files.governmentId) profile.documents.governmentId = req.files.governmentId[0].path.replace(/\\/g, '/');
                    if (req.files.workEligibility) profile.documents.workEligibility = req.files.workEligibility[0].path.replace(/\\/g, '/');
                    if (req.files.driversLicense) profile.documents.driversLicense = req.files.driversLicense[0].path.replace(/\\/g, '/');
                    if (req.files.vehicleRegistration) profile.documents.vehicleRegistration = req.files.vehicleRegistration[0].path.replace(/\\/g, '/');
                    if (req.files.insuranceProof) profile.documents.insuranceProof = req.files.insuranceProof[0].path.replace(/\\/g, '/');
                    if (req.files.bicycleOwnership) profile.documents.bicycleOwnership = req.files.bicycleOwnership[0].path.replace(/\\/g, '/');
                }
                break;

            case 5: // Background Check
                profile.backgroundCheck = {
                    consented: stepData.consented,
                    consentedAt: stepData.consented ? new Date() : undefined,
                    status: 'pending'
                };
                break;

            case 6: // Payment Setup
                profile.paymentInfo = {
                    bankName: stepData.bankName,
                    accountNumber: stepData.accountNumber,
                    routingNumber: stepData.routingNumber,
                    paymentApp: stepData.paymentApp,
                    preference: stepData.preference
                };
                if (req.files && req.files.chequePhoto) {
                    profile.paymentInfo.chequePhoto = req.files.chequePhoto[0].path.replace(/\\/g, '/');
                }
                break;

            case 7: // Inspection & Submission
                if (req.files && req.files.inspectionPhotos) {
                    profile.inspection.inspectionPhotos = req.files.inspectionPhotos.map(f => f.path.replace(/\\/g, '/'));
                    profile.inspection.status = 'pending';
                }

                // Mark as submitted
                profile.onboardingStatus = 'pending_review';
                profile.submittedAt = new Date();

                // Ensure user status is pending
                await User.findByIdAndUpdate(userId, { status: 'pending' });
                break;

            default:
                break;
        }

        // Update current step if the submitted step is greater or equal
        // Max step is now 7 (Inspection), leading to Review (8 in DB, index 7 in FE)
        if (parseInt(step) >= profile.currentStep && parseInt(step) < 8) {
            profile.currentStep = parseInt(step) + 1;
        }

        await profile.save();

        res.json({
            success: true,
            message: `Step ${step} saved successfully`,
            data: profile
        });

    } catch (error) {
        logger.error(`Error saving onboarding step ${req.body.step}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to save onboarding step',
            error: error.message
        });
    }
};

const { sendEmail } = require('../services/emailService');

// ... existing code ...

/**
 * @route   GET /api/delivery/onboarding/admin/applications
 * @desc    Get all delivery applications (pending/review/approved/rejected)
 * @access  Private (Admin)
 */
const getAllApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) {
            query.onboardingStatus = status;
        } else {
            // Default: show everything except strictly 'in_progress' unless specifically asked?
            // Actually, admin usually wants to see pending_review first.
            // Let's allow filtering, but default to all submitted.
            query.onboardingStatus = { $ne: 'in_progress' };
        }

        const applications = await DeliveryProfile.find(query)
            .populate('userId', 'firstName lastName email phone status')
            .sort({ submittedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await DeliveryProfile.countDocuments(query);

        res.json({
            success: true,
            data: applications,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        logger.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/delivery/onboarding/admin/applications/:id
 * @desc    Get detailed application view
 * @access  Private (Admin)
 */
const getApplicationDetails = async (req, res) => {
    try {
        const application = await DeliveryProfile.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone status');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        logger.error('Error fetching application details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application details',
            error: error.message
        });
    }
};

/**
 * @route   PATCH /api/delivery/onboarding/admin/applications/:id/status
 * @desc    Approve or Reject an application
 * @access  Private (Admin)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        // status: 'approved' | 'rejected'

        const application = await DeliveryProfile.findById(req.params.id).populate('userId');
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (status === 'approved') {
            application.onboardingStatus = 'approved';
            application.reviewedAt = new Date();
            application.reviewerNotes = reason; // Optional notes

            // Activate User
            await User.findByIdAndUpdate(application.userId._id, { status: 'active' });

            // Send Email
            const emailHtml = `
                <h3>Congratulations, ${application.userId.firstName}!</h3>
                <p>Your application to become a MediLink Delivery Partner has been <strong>APPROVED</strong>.</p>
                <p>You can now log in to your dashboard and start accepting delivery requests.</p>
                <p>Welcome to the team!</p>
            `;
            await sendEmail(application.userId.email, 'MediLink Delivery Application Approved', emailHtml);

        } else if (status === 'rejected') {
            application.onboardingStatus = 'rejected';
            application.reviewedAt = new Date();
            application.reviewerNotes = reason || 'Does not meet requirements';

            // User status remains pending or set to rejected?
            // Usually we keep them as pending or set strict rejected.
            await User.findByIdAndUpdate(application.userId._id, { status: 'rejected' });

            // Send Email
            const emailHtml = `
                <h3>Application Update</h3>
                <p>Dear ${application.userId.firstName},</p>
                <p>We regret to inform you that your application to become a MediLink Delivery Partner has been <strong>REJECTED</strong>.</p>
                <p><strong>Reason:</strong> ${reason || 'Does not meet current requirements.'}</p>
                <p>You may contact support for further information.</p>
            `;
            await sendEmail(application.userId.email, 'MediLink Delivery Application Update', emailHtml);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await application.save();

        res.json({
            success: true,
            message: `Application ${status}`,
            data: application
        });

    } catch (error) {
        logger.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: error.message
        });
    }
};

module.exports = {
    getOnboardingStatus,
    saveOnboardingStep,
    getAllApplications,
    getApplicationDetails,
    updateApplicationStatus
};
