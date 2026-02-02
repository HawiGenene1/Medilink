const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/order/:orderId', invoiceController.getInvoiceByOrder);

module.exports = router;
