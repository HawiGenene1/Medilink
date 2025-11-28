const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getPendingRegistrations,
  getRegistrationDetails,
  approveRegistration,
  rejectRegistration,
  getAllSubscriptions,
  activateSubscription,
  deactivateSubscription,
  renewSubscription
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// Protect all routes - admin only
router.use(protect);
router.use(authorize('admin'));

// ============ PHARMACY REGISTRATION ROUTES ============

/**
 * @route   GET /api/admin/registrations
 * @desc    Get all pending pharmacy registrations
 * @access  Private (Admin only)
 */
router.get('/registrations', [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], getPendingRegistrations);

/**
 * @route   GET /api/admin/registrations/:id
 * @desc    Get details of a specific registration
 * @access  Private (Admin only)
 */
router.get('/registrations/:id', [
  param('id').isMongoId().withMessage('Invalid registration ID')
], getRegistrationDetails);

/**
 * @route   POST /api/admin/registrations/:id/approve
 * @desc    Approve a pharmacy registration
 * @access  Private (Admin only)
 */
router.post('/registrations/:id/approve', [
  param('id').isMongoId().withMessage('Invalid registration ID'),
  body('subscriptionMode').optional().isIn(['monthly', 'annually'])
], approveRegistration);

/**
 * @route   POST /api/admin/registrations/:id/reject
 * @desc    Reject a pharmacy registration
 * @access  Private (Admin only)
 */
router.post('/registrations/:id/reject', [
  param('id').isMongoId().withMessage('Invalid registration ID'),
  body('rejectionReason', 'Rejection reason is required').not().isEmpty().trim()
], rejectRegistration);

// ============ SUBSCRIPTION MANAGEMENT ROUTES ============

/**
 * @route   GET /api/admin/subscriptions
 * @desc    Get all subscriptions with filters
 * @access  Private (Admin only)
 */
router.get('/subscriptions', [
  query('status').optional().isIn(['active', 'expired', 'cancelled', 'suspended']),
  query('paymentStatus').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], getAllSubscriptions);

/**
 * @route   POST /api/admin/subscriptions/:id/activate
 * @desc    Activate a subscription after payment
 * @access  Private (Admin only)
 */
router.post('/subscriptions/:id/activate', [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
  body('paymentMethod', 'Payment method is required').isIn(['bank_transfer', 'card', 'cash', 'cheque']),
  body('transactionId', 'Transaction ID is required').not().isEmpty().trim(),
  body('receiptUrl').optional().isURL()
], activateSubscription);

/**
 * @route   POST /api/admin/subscriptions/:id/deactivate
 * @desc    Deactivate a subscription
 * @access  Private (Admin only)
 */
router.post('/subscriptions/:id/deactivate', [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
  body('reason', 'Deactivation reason is required').not().isEmpty().trim()
], deactivateSubscription);

/**
 * @route   POST /api/admin/subscriptions/:id/renew
 * @desc    Renew a subscription
 * @access  Private (Admin only)
 */
router.post('/subscriptions/:id/renew', [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
  body('mode').optional().isIn(['monthly', 'annually'])
], renewSubscription);

module.exports = router;