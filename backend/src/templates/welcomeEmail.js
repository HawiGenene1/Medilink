module.exports = (name, password, verificationToken) => {
  const verificationLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;

  return {
    subject: 'Welcome to Medilink - Activate Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #1E88E5;">Welcome to Medilink, ${name}!</h2>
        <p>Your account has been successfully created. For security reasons, your account is currently <strong>pending activation</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Login Password:</strong> ${password}</p>
        </div>

        <p>Please click the button below to verify your email address and activate your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #1E88E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Activate Account</a>
        </div>

        <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:<br>${verificationLink}</p>
        
        <p>This activation link will expire in 24 hours.</p>
        <p>After activating, please change your password upon your first login.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Best regards,<br>The Medilink Team</p>
      </div>
    `
  };
};
