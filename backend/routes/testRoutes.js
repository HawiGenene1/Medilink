const express = require('express');
const router = express.Router();

// Test routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

module.exports = router;
