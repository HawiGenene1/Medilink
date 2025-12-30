const express = require('express');
const router = express.Router();

// Basic admin routes
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Admin dashboard' });
});

module.exports = router;
