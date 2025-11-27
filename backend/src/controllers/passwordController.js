const User = require("../models/User");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expireDate = Date.now() + 15 * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpire = expireDate;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      "Password Reset Request",
      `<p>You requested a password reset.</p>
       <p><a href="${resetLink}">Click here to reset password</a></p>`
    );

    res.json({ success: true, message: "Reset link sent to email" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid token" });

    user.password = newPassword; // hashed via model
    user.resetToken = null;
    user.resetTokenExpire = null;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
