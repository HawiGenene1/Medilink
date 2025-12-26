const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  uploadPrescription,
  verifyPrescription,
  updateDeliveryStatus,
  cancelOrder,
  getOrdersByPharmacy,
  getOrderStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is authenticated
router.use(protect);

// Public routes (require authentication)
router
  .route('/')
  .post(
    createOrder
  )
  .get(
    getOrders
  );

router
  .route('/:id')
  .get(
    getOrder
  );

// Customer routes
router
  .route('/:id/prescription')
  .put(
    uploadPrescription
  );

router
  .route('/:id/cancel')
  .put(
    cancelOrder
  );

// Pharmacy staff routes
router
  .route('/:id/status')
  .put(
    authorize('pharmacy_staff', 'admin'),
    updateOrderStatus
  );

router
  .route('/:id/verify-prescription')
  .put(
    authorize('pharmacy_staff', 'admin'),
    verifyPrescription
  );

// Delivery routes
router
  .route('/:id/delivery-status')
  .put(
    authorize('driver', 'pharmacy_staff', 'admin'),
    updateDeliveryStatus
  );

// Admin/Pharmacy admin routes
router
  .route('/pharmacy/:pharmacyId')
  .get(
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    getOrdersByPharmacy
  );

router
  .route('/stats')
  .get(
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    getOrderStats
  );

module.exports = router;
