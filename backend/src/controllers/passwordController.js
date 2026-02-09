const User = require("../models/User");
const crypto = require("crypto");
const { sendEmail, sendOTPEmail } = require("../services/emailService");

exports.requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body; // Can be primary email, recovery email, or phone

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { recoveryEmail: identifier },
        { phone: identifier },
        { recoveryPhone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with that information" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = code; // Using token field for the OTP
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Determine target methods
    const methods = [];
    if (user.email) methods.push({ type: 'email', value: user.email, label: maskEmail(user.email) });
    if (user.recoveryEmail) methods.push({ type: 'recovery_email', value: user.recoveryEmail, label: maskEmail(user.recoveryEmail) });

    if (user.phone) {
      methods.push({ type: 'phone', value: user.phone, label: `Primary: ${maskPhone(user.phone)}` });
    }

    if (user.recoveryPhone && user.recoveryPhone !== user.phone) {
      methods.push({ type: 'recovery_phone', value: user.recoveryPhone, label: `Backup: ${maskPhone(user.recoveryPhone)}` });
    }

    // We no longer send the code automatically here to avoid duplicates.
    // The code will be sent when the user selects a method in the next step.
    res.json({
      success: true,
      message: "Recovery options found",
      methods,
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return name.substring(0, 2) + "...@" + domain;
};

const maskPhone = (phone) => {
  if (!phone) return "";
  // Keeps first 4 (+251) and last 2 digits, masks the middle
  return phone.substring(0, 4) + "*******" + phone.substring(phone.length - 2);
};

exports.sendRecoveryCode = async (req, res) => {
  try {
    const { userId, type, value } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.resetToken) return res.status(400).json({ message: "Invalid session" });

    if (type.includes('email')) {
      await sendOTPEmail(value, user.firstName, user.resetToken);
    } else {
      // Logic for SMS would go here (e.g. Twilio, AWS SNS)
    }

    res.json({ success: true, message: `Code sent to your ${type.replace('_', ' ')}` });
  } catch (e) {
    res.status(500).json({ message: "Failed to send code" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.body; // Adjusted to read from body for code submission
    const { newPassword, userId } = req.body;

    const user = await User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired recovery code" });

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    user.passwordChangedAt = Date.now();

    await user.save();

    res.json({ success: true, message: "Password reset successful! You can now log in." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
