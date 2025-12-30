const express = require('express');
const router = express.Router();

// Basic medicine routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Medicine list' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Add medicine' });
});

module.exports = router;
