const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/pharmacyOwnerController');
const { getDashboardStats, getProfile, updateProfile, updatePassword, getSubscriptionDetails, getReports, getPharmacy, updatePharmacy, getAnalytics } = require('../controllers/pharmacyOwnerDashboardController');
const { createStaff, getStaff, updateStaff, deleteStaff } = require('../controllers/pharmacyOwnerStaffController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    validateOwnerRegister,
    validateOwnerLogin,
    validateStaffCreate,
    validateStaffUpdate,
    validateProfileUpdate
} = require('../middleware/pharmacyOwnerValidation');

// Public routes
router.post('/register', validateOwnerRegister, register);
router.post('/login', validateOwnerLogin, login);

// Protected routes (Require Pharmacy Owner or Staff Authentication)
router.use(protect);
router.use(authorize('pharmacy_owner', 'PHARMACY_OWNER', 'pharmacy_staff', 'pharmacist', 'cashier'));

// Dashboard & Profile
router.get('/dashboard', getDashboardStats);
router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/profile/password', updatePassword);
router.get('/subscription', getSubscriptionDetails);
router.get('/reports', getReports);
router.get('/analytics', getAnalytics);
router.get('/pharmacy', getPharmacy);
router.put('/pharmacy', updatePharmacy);

// Staff Management
router.post('/staff', validateStaffCreate, createStaff);
router.get('/staff', getStaff);
router.put('/staff/:id', validateStaffUpdate, updateStaff);
router.delete('/staff/:id', deleteStaff);

module.exports = router;
