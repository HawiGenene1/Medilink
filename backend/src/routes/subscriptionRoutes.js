const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/plans', subscriptionController.getSubscriptionPlans);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.get(
  '/pharmacy/:pharmacyId',
  authorize('admin'),
  [
    check('pharmacyId', 'Invalid pharmacy ID').isMongoId()
  ],
  subscriptionController.getSubscriptionByPharmacy
);

// Admin routes
router.use(authorize('admin'));

router.get(
  '/',
  [
    check('page', 'Page number must be a positive integer').optional().isInt({ min: 1 }),
    check('limit', 'Limit must be a positive integer').optional().isInt({ min: 1 }),
    check('status', 'Invalid status').optional().isIn(['active', 'pending', 'canceled', 'expired', 'trial']),
    check('plan', 'Invalid plan type').optional().isIn(['Basic', 'Standard', 'Premium', 'Enterprise']),
  ],
  subscriptionController.getSubscriptions
);

router.get(
  '/:id',
  [check('id', 'Invalid subscription ID').isMongoId()],
  subscriptionController.getSubscription
);

router.post(
  '/',
  [
    check('pharmacy', 'Pharmacy ID is required').isMongoId(),
    check('plan', 'Plan type is required').isIn(['Basic', 'Standard', 'Premium', 'Enterprise']),
    check('mode', 'Billing mode is required').isIn(['monthly', 'annually']),
    check('price', 'Price must be a positive number').isFloat({ min: 0 }),
    check('trial.isTrial', 'Trial status must be a boolean').optional().isBoolean(),
    check('trial.days', 'Trial days must be between 1 and 30').optional().isInt({ min: 1, max: 30 })
  ],
  subscriptionController.createSubscription
);

router.put(
  '/:id',
  [
    check('id', 'Invalid subscription ID').isMongoId(),
    check('plan', 'Invalid plan type').optional().isIn(['Basic', 'Standard', 'Premium', 'Enterprise']),
    check('mode', 'Invalid billing mode').optional().isIn(['monthly', 'annually']),
    check('status', 'Invalid status').optional().isIn(['active', 'pending', 'canceled', 'expired', 'trial', 'suspended'])
  ],
  subscriptionController.updateSubscription
);

router.delete(
  '/:id',
  [check('id', 'Invalid subscription ID').isMongoId()],
  subscriptionController.cancelSubscription
);

router.post(
  '/:id/renew',
  [check('id', 'Invalid subscription ID').isMongoId()],
  subscriptionController.renewSubscription
);

router.post(
  '/:id/upgrade',
  [
    check('id', 'Invalid subscription ID').isMongoId(),
    check('plan', 'Plan type is required').isIn(['Basic', 'Standard', 'Premium', 'Enterprise']),
    check('prorate', 'Prorate must be a boolean').optional().isBoolean()
  ],
  subscriptionController.changeSubscriptionPlan
);

module.exports = router;
