const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createStaff, getStaff } = require('../controllers/pharmacyAdminController');

router.use(protect);
router.use(authorize('pharmacy_admin'));

router.post('/staff', createStaff);
router.get('/staff', getStaff);

module.exports = router;
