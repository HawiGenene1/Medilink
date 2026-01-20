const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  updateDeliveryStatus,
  updateLocation,
  getTrackingInfo,
  getDeliveryStats,
  addDeliveryNote
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Apply authentication middleware to all delivery routes
router.use(protect);

// Delivery person routes
router.get('/assignments', authorize('delivery'), getDeliveries);
router.get('/stats', authorize('delivery'), getDeliveryStats);
router.patch('/:id/status', authorize('delivery'), updateDeliveryStatus);
router.post('/:id/location', authorize('delivery'), updateLocation);
router.post('/:id/notes', authorize('delivery'), addDeliveryNote);

// Customer and admin tracking routes
router.get('/:id/tracking', getTrackingInfo);

module.exports = router;