const express = require('express');
const router = express.Router();
const {
    registerDeliveryPerson,
    getAllApplications,
    getApplicationDetails,
    approveApplication,
    rejectApplication
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Assuming these exist
// Note: You might need to check if authMiddleware path is correct. Usually it is in ../middleware/authMiddleware.js

// Public routes
router.post('/register', registerDeliveryPerson);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/admin/applications', getAllApplications);
router.get('/admin/applications/:id', getApplicationDetails);
router.post('/admin/applications/:id/approve', approveApplication);
router.post('/admin/applications/:id/reject', rejectApplication);

module.exports = router;
