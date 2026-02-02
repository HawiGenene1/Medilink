const express = require('express');
const router = express.Router();
const {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionDetails,
  updatePrescriptionStatus,
  deletePrescription
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize: roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication middleware to all prescription routes
router.use(protect);

// Customer routes
router.post('/upload', roleMiddleware('customer'), uploadPrescription);
router.get('/', roleMiddleware('customer'), getPrescriptions);
router.get('/:id', getPrescriptionDetails);
router.delete('/:id', roleMiddleware('customer'), deletePrescription);

<<<<<<< HEAD
// Protected routes for pharmacy staff
router.get(
  '/pending',
  authenticate,
  authorize(['admin']),
  getPendingPrescriptions
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin']),
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be either "approved" or "rejected"'),
    body('reviewNotes').optional().trim()
  ],
  updatePrescriptionStatus
);

module.exports = router;
=======
// Pharmacy staff/admin routes
router.patch('/:id/status', roleMiddleware(['pharmacy_staff', 'pharmacy_admin', 'admin']), updatePrescriptionStatus);

module.exports = router;
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
