/**
 * OTP Email Template
 * @param {string} name - User's name
 * @param {string} code - 6-digit OTP code
 * @returns {{subject: string, html: string}}
 */
const otpEmail = (name, code) => {
    return {
        subject: 'Your Medilink Recovery Code',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
                <div style="background-color: #4361ee; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Medilink</h1>
                </div>
                <div style="padding: 40px 30px; line-height: 1.6;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${name},</h2>
                    <p style="font-size: 16px;">We received a request to access your Medilink account. Use the code below to complete your recovery:</p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: bold; color: #4361ee; letter-spacing: 10px; display: block;">${code}</span>
                    </div>

                    <p style="font-size: 14px; color: #666;">This code will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
                    <p>&copy; ${new Date().getFullYear()} Medilink. All rights reserved.</p>
                </div>
            </div>
        `
    };
};

module.exports = otpEmail;
