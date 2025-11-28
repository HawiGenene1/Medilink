module.exports = (name, password) => ({
  subject: 'Welcome to Medilink - Your Account is Ready!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Medilink, ${name}!</h2>
      <p>Your account has been successfully created.</p>
      <p>Here are your login credentials:</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please change your password after your first login.</p>
      <p>If you didn't request this account, please contact support immediately.</p>
      <br>
      <p>Best regards,<br>The Medilink Team</p>
    </div>
  `
});
