const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    findNearbyDrivers,
    requestDelivery,
    acceptOrder,
    updateDriverStatus,
    startDelivery,
    completeDelivery,
    getActiveDeliveries,
    getDeliveryHistory,
    getEarningsStats,
    getAvailableRequests,
    getDeliveryProfile,
    requestPayout
} = require('../controllers/deliveryController');

// All routes here should be protected
router.use(protect);

router.get('/nearby', findNearbyDrivers);
router.post('/request', requestDelivery);
router.get('/requests/available', authorize('delivery'), getAvailableRequests);
router.put('/accept', authorize('delivery'), acceptOrder);
router.put('/status', authorize('delivery'), updateDriverStatus);

// Status Actions
router.put('/pickup', authorize('delivery'), startDelivery);
router.put('/complete', authorize('delivery'), completeDelivery);

// Metrics & Dashboard
router.get('/active', authorize('delivery'), getActiveDeliveries);
router.get('/history', authorize('delivery'), getDeliveryHistory);
router.get('/profile', authorize('delivery'), getDeliveryProfile);
router.get('/earnings', authorize('delivery'), getEarningsStats);
router.post('/payout/request', authorize('delivery'), requestPayout);

module.exports = router;
