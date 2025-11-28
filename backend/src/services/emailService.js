const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        logger.error('Email server connection error:', error);
    } else {
        logger.info('Email server is ready to take our messages');
    }
});

/**
 * Send email with retry logic
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendEmail(to, subject, html, retries = 3) {
    const mailOptions = {
        from: `"Medilink" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            await transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to} (attempt ${i + 1}/${retries})`);
            return { success: true };
        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, i) * 1000; // Exponential backoff
            logger.warn(`Email send failed (attempt ${i + 1}/${retries}): ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    logger.error(`Failed to send email to ${to} after ${retries} attempts:`, lastError);
    return { 
        success: false, 
        error: `Failed to send email after ${retries} attempts: ${lastError.message}` 
    };
}

/**
 * Send welcome email with generated password
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} password - Generated password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendWelcomeEmail(email, name, password) {
    const welcomeEmail = require('../templates/welcomeEmail');
    const { subject, html } = welcomeEmail(name, password);
    return sendEmail(email, subject, html);
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} resetLink - Password reset link
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPasswordResetEmail(email, name, resetLink) {
    const passwordResetEmail = require('../templates/passwordResetEmail');
    const { subject, html } = passwordResetEmail(name, resetLink);
    return sendEmail(email, subject, html);
}

module.exports = { 
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    transporter 
};