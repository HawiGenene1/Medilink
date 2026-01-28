const router = require("express").Router();
const { sendEmail, sendWelcomeEmail, sendPasswordResetEmail } = require("../services/emailService");

// Test basic email sending
router.post("/email-test", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, html'
      });
    }

    const result = await sendEmail(to, subject, html);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          to,
          subject,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Test welcome email
router.post("/welcome-email-test", async (req, res) => {
  try {
    const { to, name, password, verificationToken } = req.body;

    if (!to || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, name'
      });
    }

    const testPassword = password || 'TestPassword123';
    const testToken = verificationToken || 'test-verification-token';

    const result = await sendWelcomeEmail(to, name, testPassword, testToken);

    if (result.success) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        data: {
          to,
          name,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Test password reset email
router.post("/password-reset-test", async (req, res) => {
  try {
    const { to, name, resetLink } = req.body;

    if (!to || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, name'
      });
    }

    const testResetLink = resetLink || 'http://localhost:3000/reset-password/test-token';

    const result = await sendPasswordResetEmail(to, name, testResetLink);

    if (result.success) {
      res.json({
        success: true,
        message: 'Password reset email sent successfully',
        data: {
          to,
          name,
          resetLink: testResetLink,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Test email service status
router.get("/email-status", async (req, res) => {
  try {
    const { transporter } = require("../services/emailService");

    // Test connection
    await transporter.verify();

    res.json({
      success: true,
      message: 'Email service is connected and ready',
      data: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email service connection failed',
      error: error.message
    });
  }
});

module.exports = router;
