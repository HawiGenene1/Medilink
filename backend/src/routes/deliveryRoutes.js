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
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication middleware to all delivery routes
router.use(protect);

// Delivery person routes
router.get('/assignments', roleMiddleware('delivery'), getDeliveries);
router.get('/stats', roleMiddleware('delivery'), getDeliveryStats);
router.patch('/:id/status', roleMiddleware('delivery'), updateDeliveryStatus);
router.post('/:id/location', roleMiddleware('delivery'), updateLocation);
router.post('/:id/notes', roleMiddleware('delivery'), addDeliveryNote);

// Customer and admin tracking routes
router.get('/:id/tracking', getTrackingInfo);

module.exports = router;