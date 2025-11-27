const nodemailer = require('nodemailer');
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: process.env.Email_USER,
        pass:process.env.EMAIL_PASS,
       
    },
});
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Medilink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}
module.exports = { sendEmail };