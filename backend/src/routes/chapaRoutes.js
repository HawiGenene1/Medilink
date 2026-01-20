const express = require('express');
const router = express.Router();
const { initializeChapaPayment, verifyChapaPayment, cancelChapaPayment } = require('../controllers/chapaController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/initialize', authenticate, initializeChapaPayment);
router.get('/verify/:txRef', authenticate, verifyChapaPayment);
router.put('/cancel/:txRef', authenticate, cancelChapaPayment);

module.exports = router;
