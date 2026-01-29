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
transporter.verify(function (error, success) {
    if (error) {
        logger.error('Email server connection error:', error);
    } else {
        logger.info('Email server is ready to take our messages');
    }
});

/**
 * Send email with retry logic
 * @param {string|object} to - Recipient email or options object
 * @param {string} [subject] - Email subject
 * @param {string} [content] - Email content (html or text)
 * @param {number} [retries] - Number of retry attempts (default: 3)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendEmail(to, subject, content, retries = 3) {
    let mailOptions;

    if (typeof to === 'object' && to !== null) {
        // Handle object argument
        const options = to;
        mailOptions = {
            from: `"Medilink" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html || (options.text ? options.text.replace(/\n/g, '<br>') : undefined),
            text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : undefined)
        };
        retries = options.retries || 3;
    } else {
        // Handle positional arguments
        mailOptions = {
            from: `"Medilink" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: content // Assuming html content is passed for backward compatibility
        };
    }

    let lastError;

    for (let i = 0; i < retries; i++) {
        try {
            await transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${mailOptions.to} (attempt ${i + 1}/${retries})`);
            return { success: true };
        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, i) * 1000; // Exponential backoff
            logger.warn(`Email send failed (attempt ${i + 1}/${retries}): ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    logger.error(`Failed to send email to ${mailOptions.to} after ${retries} attempts:`, lastError);
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
async function sendWelcomeEmail(email, name, password, verificationToken) {
    const welcomeEmail = require('../templates/welcomeEmail');
    const { subject, html } = welcomeEmail(name, password, verificationToken);
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