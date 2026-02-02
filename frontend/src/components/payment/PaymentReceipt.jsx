import React from 'react';
import './PaymentReceipt.css';

const PaymentReceipt = ({ 
  receiptData = {},
  onPrint,
  onDownload,
  onEmail
}) => {
  const {
    payerName = 'Full Name',
    phoneNumber = '2519*******',
    emailAddress = 'email@example.com',
    paymentMethod = 'Telebirr',
    status = 'Paid',
    paymentDate = new Date().toLocaleDateString('en-GB'),
    paymentReason = 'Order Payment via Chapa',
    chapaReference = 'PLSI6wja6GSh',
    bankReference = 'CGO3PAXUSH',
    subTotal = '100,000',
    charge = '2,500',
    total = '102,500'
  } = receiptData;

  const handlePrint = () => {
    window.print();
    if (onPrint) onPrint();
  };

  const handleDownload = () => {
    // Create a temporary link element to download the receipt
    const element = document.createElement('a');
    const file = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `medilink-receipt-${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    if (onDownload) onDownload();
  };

  return (
    <div className="payment-receipt-container">
      <div className="receipt-actions">
        <button onClick={handlePrint} className="btn btn-print">
          🖨️ Print Receipt
        </button>
        <button onClick={handleDownload} className="btn btn-download">
          📥 Download
        </button>
        {onEmail && (
          <button onClick={onEmail} className="btn btn-email">
            ✉️ Email Receipt
          </button>
        )}
      </div>

      <div className="receipt">
        {/* HEADER */}
        <div className="header">
          <div className="logo-placeholder">
            <h2>🏥 MediLink</h2>
          </div>
          <h1>RECEIPT</h1>
        </div>

        {/* MERCHANT INFO */}
        <div className="merchant">
          <div>
            <strong>Receipt From</strong>
            MediLink Pharmacy<br />
            TIN: 007756****<br />
            Phone: +251-9XXXXXXXX<br />
            Address: Addis Ababa
          </div>

          <div>
            <strong>Payment Processor</strong>
            Chapa Financial Technologies S.C<br />
            TIN: 0071406415<br />
            Phone: +251-960724272<br />
            Website: chapa.co
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="section-title">PAYMENT DETAILS</div>

        <table>
          <tbody>
            <tr>
              <td>Payer Name</td>
              <td>{payerName}</td>
            </tr>
            <tr>
              <td>Phone Number</td>
              <td>{phoneNumber}</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td>{emailAddress}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td>{paymentMethod}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td className={`status ${status.toLowerCase()}`}>{status}</td>
            </tr>
            <tr>
              <td>Payment Date</td>
              <td>{paymentDate}</td>
            </tr>
            <tr>
              <td>Payment Reason</td>
              <td>{paymentReason}</td>
            </tr>
          </tbody>
        </table>

        {/* REFERENCES + TOTAL */}
        <div className="summary">
          <div>
            <strong>References</strong><br />
            Chapa Ref: {chapaReference}<br />
            Bank Ref: {bankReference}
          </div>

          <table>
            <tbody>
              <tr>
                <td>Sub Total</td>
                <td align="right">{subTotal} ETB</td>
              </tr>
              <tr>
                <td>Charge</td>
                <td align="right">{charge} ETB</td>
              </tr>
              <tr className="total">
                <td>Total</td>
                <td align="right">{total} ETB</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <span>📞 +251-960724272</span>
          <span>✉ info@medilink.com</span>
          <span>Thank You For Using MediLink</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
