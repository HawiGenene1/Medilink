const express = require("express");
const router = express.Router();

// Test route to verify auth routes are working
router.get("/test", (req, res) => {
  res.json({ 
    success: true,
    message: "Auth routes are working!" 
  });
});

// Simple register endpoint
router.post("/register", (req, res) => {
  res.json({
    success: true,
    message: "Register endpoint working",
    data: req.body
  });
});

// Simple login endpoint
router.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login endpoint working", 
    data: req.body
  });
});

module.exports = router;