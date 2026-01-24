
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getOnboardingStatus,
    saveOnboardingStep,
    getAllApplications,
    getApplicationDetails,
    updateApplicationStatus
} = require('../controllers/deliveryOnboardingController');

// ... (Multer config remains same)

// Routes
router.use(protect); // Ensure user is logged in

// Applicant Routes
router.get('/status', getOnboardingStatus);
router.post('/step', onboardingUpload, saveOnboardingStep);

// Admin Routes
router.get('/admin/applications', authorize('admin'), getAllApplications);
router.get('/admin/applications/:id', authorize('admin'), getApplicationDetails);
router.patch('/admin/applications/:id/status', authorize('admin'), updateApplicationStatus);

module.exports = router;
