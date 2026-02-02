const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { authenticate } = require('../middleware/authMiddleware');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password or app password
  }
});

/**
 * @route   POST /api/payments/email-receipt
 * @desc    Email payment receipt to customer
 * @access  Private
 */
router.post('/email-receipt', authenticate, async (req, res) => {
  try {
    const { receiptData, recipientEmail, htmlContent } = req.body;

    if (!recipientEmail || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and HTML content are required'
      });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@medilink.com',
      to: recipientEmail,
      subject: `Payment Receipt - ${receiptData.orderNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `receipt-${receiptData.orderNumber}.html`,
          content: htmlContent,
          contentType: 'text/html'
        }
      ]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Receipt emailed successfully'
    });

  } catch (error) {
    console.error('Error emailing receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to email receipt',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/download-receipt
 * @desc    Generate receipt for download
 * @access  Private
 */
router.post('/download-receipt', authenticate, async (req, res) => {
  try {
    const { receiptData } = req.body;

    // Generate HTML receipt
    const htmlContent = generateReceiptHTML(receiptData);

    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="medilink-receipt-${receiptData.orderNumber}.html"`);
    
    res.send(htmlContent);

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
      error: error.message
    });
  }
});

/**
 * Generate receipt HTML template with data
 */
function generateReceiptHTML(receiptData) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Payment Receipt - ${receiptData.orderNumber}</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            margin: 0;
          }
          .receipt {
            max-width: 900px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #ddd;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0c1f3f;
            padding: 15px 20px;
            color: #fff;
          }
          .header img {
            height: 40px;
          }
          .header h1 {
            color: #7ed321;
            margin: 0;
            font-size: 32px;
            letter-spacing: 2px;
          }
          .merchant {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            font-size: 14px;
          }
          .merchant div {
            width: 48%;
          }
          .merchant strong {
            display: block;
            margin-bottom: 6px;
          }
          .section-title {
            background: #7ed321;
            color: #fff;
            padding: 10px 20px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          table td {
            padding: 10px 20px;
            border-bottom: 1px solid #eee;
          }
          table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .summary {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            font-size: 14px;
          }
          .summary table {
            width: 300px;
          }
          .summary td {
            padding: 6px 0;
            border: none;
          }
          .summary .total {
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background: #0c1f3f;
            color: #fff;
            padding: 15px 20px;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer span {
            display: block;
          }
          @media print {
            body { background: white; padding: 0; }
            .receipt { border: none; box-shadow: none; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo-placeholder">
              <h2 style="margin: 0; color: #7ed321;">🏥 MediLink</h2>
            </div>
            <h1>RECEIPT</h1>
          </div>
          <div class="merchant">
            <div>
              <strong>Receipt From</strong>
              MediLink Pharmacy<br>
              TIN: 007756****<br>
              Phone: +251-9XXXXXXXX<br>
              Address: Addis Ababa
            </div>
            <div>
              <strong>Payment Processor</strong>
              Chapa Financial Technologies S.C<br>
              TIN: 0071406415<br>
              Phone: +251-960724272<br>
              Website: chapa.co
            </div>
          </div>
          <div class="section-title">PAYMENT DETAILS</div>
          <table>
            <tr><td>Payer Name</td><td>${receiptData.payerName}</td></tr>
            <tr><td>Phone Number</td><td>${receiptData.phoneNumber}</td></tr>
            <tr><td>Email Address</td><td>${receiptData.emailAddress}</td></tr>
            <tr><td>Payment Method</td><td>${receiptData.paymentMethod}</td></tr>
            <tr><td>Status</td><td>${receiptData.status}</td></tr>
            <tr><td>Payment Date</td><td>${receiptData.paymentDate}</td></tr>
            <tr><td>Payment Reason</td><td>${receiptData.paymentReason}</td></tr>
          </table>
          <div class="summary">
            <div>
              <strong>References</strong><br>
              Chapa Ref: ${receiptData.chapaReference}<br>
              Bank Ref: ${receiptData.bankReference}
            </div>
            <table>
              <tr><td>Sub Total</td><td align="right">${receiptData.subTotal} ETB</td></tr>
              <tr><td>Charge</td><td align="right">${receiptData.charge} ETB</td></tr>
              <tr class="total"><td>Total</td><td align="right">${receiptData.total} ETB</td></tr>
            </table>
          </div>
          <div class="footer">
            <span>📞 +251-960724272</span>
            <span>✉ info@medilink.com</span>
            <span>Thank You For Using MediLink</span>
          </div>
        </div>
      </body>
      </html>
    `;
}

module.exports = router;
