const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineDetails,
  getCategories,
  getFeaturedMedicines,
  searchMedicines
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Apply authentication middleware to all customer routes
router.use(protect);
router.use(authorize('customer'));

// Medicine routes
router.get('/medicines', getMedicines);
router.get('/medicines/featured', getFeaturedMedicines);
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id', getMedicineDetails);

// Category routes
router.get('/categories', getCategories);

module.exports = router;