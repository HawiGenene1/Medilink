const express = require('express');
const router = express.Router();

// Basic pharmacy routes
router.get('/inventory', (req, res) => {
  res.json({ success: true, message: 'Pharmacy inventory' });
});

module.exports = router;
