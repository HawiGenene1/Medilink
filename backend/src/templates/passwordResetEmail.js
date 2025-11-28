module.exports = (name, resetLink) => ({
  subject: 'Password Reset Request - Medilink',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${name},</h2>
      <p>You've requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email or contact support.</p>
      <br>
      <p>Best regards,<br>The Medilink Team</p>
    </div>
  `
});
