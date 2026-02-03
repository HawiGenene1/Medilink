const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;
let emailPreviewUrl = null;

// Initialize transporter - use Ethereal for testing if no credentials
async function initTransporter() {
    if (transporter) return transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Use configured email service (Gmail, etc.)
        transporter = nodemailer.createTransport({
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
        logger.info('Email service configured with provided credentials');
    } else {
        // Create Ethereal test account for development
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            logger.info('=====================================');
            logger.info('EMAIL TEST MODE - Using Ethereal');
            logger.info(`View sent emails at: https://ethereal.email`);
            logger.info(`Login: ${testAccount.user}`);
            logger.info(`Password: ${testAccount.pass}`);
            logger.info('=====================================');
        } catch (error) {
            logger.error('Failed to create Ethereal test account:', error);
            // Create a dummy transporter that logs emails
            transporter = {
                sendMail: async (options) => {
                    logger.info('=== EMAIL WOULD BE SENT ===');
                    logger.info(`To: ${options.to}`);
                    logger.info(`Subject: ${options.subject}`);
                    logger.info(`Content preview: ${options.html?.substring(0, 200)}...`);
                    return { messageId: 'dummy-' + Date.now() };
                }
            };
        }
    }

    return transporter;
}

// Initialize immediately
initTransporter();

/**
 * Send email with retry logic
 */
async function sendEmail(to, subject, content, retries = 3) {
    // Ensure transporter is initialized
    if (!transporter) {
        await initTransporter();
    }

    let mailOptions;

    if (typeof to === 'object' && to !== null) {
        // Handle object argument
        const options = to;
        const fromEmail = process.env.EMAIL_USER || (transporter.options?.auth?.user) || 'noreply@medilink.com';
        mailOptions = {
            from: `"Medilink" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html || (options.text ? options.text.replace(/\n/g, '<br>') : undefined),
            text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : undefined)
        };
        retries = options.retries || 3;
    } else {
        // Handle positional arguments
        const fromEmail = process.env.EMAIL_USER || (transporter.options?.auth?.user) || 'noreply@medilink.com';
        mailOptions = {
            from: `"Medilink" <${fromEmail}>`,
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
async function sendWelcomeEmail(email, name, password, verificationToken, role = 'customer') {
    const welcomeEmail = require('../templates/welcomeEmail');
    const { subject, html } = welcomeEmail(name, password, verificationToken, role);
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