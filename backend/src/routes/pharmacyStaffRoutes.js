const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const pharmacyStaffController = require('../controllers/pharmacyStaffController');
const { protect, authorize } = require('../middleware/authMiddleware');
const authorizePharmacyStaff = require('../middleware/pharmacyStaffMiddleware');

// Protect all routes with JWT
router.use(protect);

// Verify user is a pharmacy staff member
router.use(authorizePharmacyStaff());

// Medicine routes
router
  .route('/medicines')
  .get(pharmacyStaffController.getMedicines)
  .post(
    [
      check('name', 'Please add name').not().isEmpty(),
      check('price', 'Please include a valid price').isNumeric(),
      check('stock', 'Please include a valid stock quantity').isInt(),
      check('category', 'Please include a valid category').isIn([
        'prescription',
        'otc',
        'supplement',
        'equipment'
      ])
    ],
    pharmacyStaffController.createMedicine
  );

router
  .route('/medicines/low-stock')
  .get(pharmacyStaffController.getLowStockMedicines);

router
  .route('/medicines/expiring')
  .get(pharmacyStaffController.getExpiringMedicines);

router
  .route('/medicines/:id')
  .get(pharmacyStaffController.getMedicine)
  .put(
    [
      check('price', 'Please include a valid price').optional().isNumeric(),
      check('stock', 'Please include a valid stock quantity').optional().isInt()
    ],
    pharmacyStaffController.updateMedicine
  )
  .delete(pharmacyStaffController.deleteMedicine);

router
  .route('/medicines/:id/stock')
  .put(
    [
      check('quantity', 'Please include a valid quantity').isInt({ min: 1 }),
      check('action', 'Please include a valid action').isIn(['add', 'subtract', 'set'])
    ],
    pharmacyStaffController.updateStock
  );

module.exports = router;
