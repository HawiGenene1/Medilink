import api from '../api';

class ReceiptService {
  /**
   * Generate receipt data from payment information
   */
  static generateReceiptData(paymentData, orderData, userData) {
    const {
      transactionId,
      paymentMethod,
      status,
      amount,
      charge,
      createdAt,
      chapaReference,
      bankReference
    } = paymentData;

    const {
      firstName,
      lastName,
      email,
      phone
    } = userData;

    const {
      orderNumber,
      items = []
    } = orderData;

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-ET', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    return {
      payerName: `${firstName} ${lastName}`,
      phoneNumber: phone,
      emailAddress: email,
      paymentMethod: this.getPaymentMethodName(paymentMethod),
      status: status,
      paymentDate: new Date(createdAt).toLocaleDateString('en-GB'),
      paymentReason: `Order Payment - ${orderNumber}`,
      chapaReference: chapaReference || 'N/A',
      bankReference: bankReference || 'N/A',
      subTotal: formatCurrency(subtotal),
      charge: formatCurrency(charge || 0),
      total: formatCurrency(amount),
      orderNumber: orderNumber,
      transactionId: transactionId
    };
  }

  /**
   * Get human readable payment method name
   */
  static getPaymentMethodName(method) {
    const methods = {
      'telebirr': 'Telebirr',
      'chapa': 'Chapa',
      'card': 'Credit/Debit Card',
      'bank_transfer': 'Bank Transfer',
      'mobile_money': 'Mobile Money',
      'cash': 'Cash'
    };
    return methods[method] || method;
  }

  /**
   * Generate receipt HTML template with data
   */
  static generateReceiptHTML(receiptData) {
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

  /**
   * Download receipt as HTML file
   */
  static downloadReceipt(receiptData) {
    const html = this.generateReceiptHTML(receiptData);
    const element = document.createElement('a');
    const file = new Blob([html], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `medilink-receipt-${receiptData.orderNumber}-${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Print receipt
   */
  static printReceipt(receiptData) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(this.generateReceiptHTML(receiptData));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  /**
   * Email receipt (requires backend implementation)
   */
  static async emailReceipt(receiptData, recipientEmail) {
    try {
      const response = await api.post('/payments/email-receipt', {
        receiptData,
        recipientEmail,
        htmlContent: this.generateReceiptHTML(receiptData)
      });
      return response.data;
    } catch (error) {
      console.error('Error emailing receipt:', error);
      throw error;
    }
  }
}

export default ReceiptService;
