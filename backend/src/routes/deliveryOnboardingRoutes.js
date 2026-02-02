
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

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/onboarding/');
    },
    filename: (req, file, cb) => {
        cb(null, `onboarding-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });
const onboardingUpload = upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'workEligibility', maxCount: 1 },
    { name: 'driversLicense', maxCount: 1 },
    { name: 'vehicleRegistration', maxCount: 1 },
    { name: 'insuranceProof', maxCount: 1 },
    { name: 'bicycleOwnership', maxCount: 1 },
    { name: 'chequePhoto', maxCount: 1 },
    { name: 'inspectionPhotos', maxCount: 10 }
]);

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
