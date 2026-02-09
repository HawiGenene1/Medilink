module.exports = (name, password, verificationToken, role = 'customer') => {
  const escapeHTML = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const escapedName = escapeHTML(name);
  const escapedPassword = escapeHTML(password);
  const verificationLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;
  const isCustomer = role === 'customer';

  return {
    subject: isCustomer ? 'Welcome to Medilink - Your Account is Ready' : 'Welcome to Medilink - Activate Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #1E88E5;">Welcome to Medilink, ${escapedName}!</h2>
        <p>Your account has been successfully created. ${isCustomer
        ? 'Your account is <strong>active</strong> and ready to use.'
        : 'For security reasons, your account is currently <strong>pending activation</strong> and review.'}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Login Password:</strong> ${escapedPassword}</p>
        </div>

        <p>${isCustomer
        ? 'You can log in immediately using the password above. We also recommend verifying your email address:'
        : 'Please click the button below to verify your email address and initiate the activation process:'}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #1E88E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>

        <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:<br>${verificationLink}</p>
        
        <p>This verification link will expire in 24 hours.</p>
        <p>After logging in, please change your password for better security.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Best regards,<br>The Medilink Team</p>
      </div>
    `
  };
};
