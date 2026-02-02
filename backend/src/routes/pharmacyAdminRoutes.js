const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/authMiddleware');
const pharmacyAdminController = require('../controllers/pharmacyAdminController');

// All routes require authentication and pharmacy_admin role
router.use(auth);
router.use(restrictTo('pharmacy_admin'));

// Dashboard
router.get('/dashboard-stats', pharmacyAdminController.getDashboardStats);

// Registration Management
router.get('/registrations', pharmacyAdminController.getRegistrations);
router.get('/registrations/:id', pharmacyAdminController.getRegistrationDetails);
router.put('/registrations/:id/approve', pharmacyAdminController.approveRegistration);
router.put('/registrations/:id/reject', pharmacyAdminController.rejectRegistration);

// Pharmacy Management
router.get('/pharmacies', pharmacyAdminController.getAllPharmacies);
router.put('/pharmacies/:id/status', pharmacyAdminController.updatePharmacyStatus);

// Subscription Management
router.get('/subscriptions', pharmacyAdminController.getAllSubscriptions);
router.post('/subscriptions', pharmacyAdminController.assignSubscription);
router.put('/subscriptions/:id', pharmacyAdminController.updateSubscription);
router.get('/subscriptions/:id/history', pharmacyAdminController.getSubscriptionHistory);

// Subscription Plans
router.get('/subscription-plans', pharmacyAdminController.getSubscriptionPlans);

// Reports
router.get('/reports', pharmacyAdminController.generateReports);

// Alerts
router.get('/alerts', pharmacyAdminController.getAlerts);

module.exports = router;
