const router = require("express").Router();
const { sendEmail } = require("../services/emailService");

router.get("/email-test", async (req, res) => {
  await sendEmail("your_email@gmail.com", "Test Email", "<h3>Hello!</h3>");
  res.send("Email sent");
});

module.exports = router;
