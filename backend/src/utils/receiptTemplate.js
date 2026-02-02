
const generateReceiptHTML = (data) => {
    // data includes: merchant, customer, payment, reference, amount

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 4px solid #8cc63f; /* Chapa Green */
        }
        .logo-section {
          width: 50%;
        }
        .logo-text {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50; /* Dark Blue */
        }
        .logo-subtitle {
           color: #8cc63f;
        }
        .receipt-title {
          font-size: 36px;
          font-weight: bold;
          color: #8cc63f;
          text-align: right;
          text-transform: uppercase;
        }
        .merchant-info {
          text-align: right;
          font-size: 14px;
          margin-top: 10px;
        }
        .merchant-info p {
          margin: 2px 0;
        }
        
        .section-title {
          background-color: #8cc63f;
          color: white;
          padding: 8px 15px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 0;
          font-size: 14px;
          display: inline-block;
          min-width: 200px;
        }
        
        .ref-box {
          background-color: #2c3e50;
          color: white;
          padding: 8px 20px;
          font-weight: bold;
          float: right;
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          background-color: #f9f9f9;
        }
        .details-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        .label-col {
          font-weight: bold;
          color: #555;
          width: 40%;
        }
        .value-col {
          font-weight: bold;
          color: #000;
        }
        
        .footer-row {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .references {
          width: 50%;
        }
        .amounts {
          width: 40%;
        }
        .amount-table {
          width: 100%;
        }
        .amount-table td {
           padding: 5px 0;
           text-align: right;
        }
        .total-row {
           font-size: 18px;
           font-weight: bold;
           border-top: 1px solid #aaa;
           padding-top: 10px !important;
        }
        
        .stamps {
           text-align: center;
           margin-top: 20px;
        }
        .stamp-circle {
           border: 2px solid #2361ac;
           color: #2361ac;
           border-radius: 50%;
           width: 100px;
           height: 100px;
           display: inline-flex;
           align-items: center;
           justify-content: center;
           font-weight: bold;
           font-size: 12px;
           text-transform: uppercase;
           transform: rotate(-15deg);
        }

        .footer-bar {
          background-color: #2c3e50;
          color: white;
          padding: 15px;
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .footer-bar div {
           display: flex;
           align-items: center;
           gap: 10px;
        }
      </style>
    </head>
    <body>
    
      <div class="header">
        <div class="logo-section">
          <div class="logo-text">MEDILINK <span class="logo-subtitle">PHARMACY</span></div>
        </div>
        
        <div class="right-header">
           <div class="receipt-title">RECEIPT</div>
           <div class="merchant-info">
             <p><strong>${data.merchant.name}</strong></p>
             <p>TIN: ${data.merchant.tin || 'N/A'}</p>
             <p>Phone: ${data.merchant.phone || 'N/A'}</p>
             <p>Address: ${data.merchant.address}</p>
           </div>
        </div>
      </div>
      
      <div style="overflow: hidden; margin-bottom: 2px;">
         <div class="section-title">PAYMENT DETAILS</div>
         <div class="ref-box">${data.reference.chapaTxId || 'N/A'}</div>
      </div>
      
      <table class="details-table">
        <tr>
           <td class="label-col">Payer Name / የከፋይ ስም</td>
           <td class="value-col">${data.customer.name}</td>
        </tr>
        <tr>
           <td class="label-col">Phone Number / ስልክ ቁጥር</td>
           <td class="value-col">${data.customer.phone}</td>
        </tr>
        <tr>
           <td class="label-col">Email Address / ኢሜይል አድራሻ</td>
           <td class="value-col">${data.customer.email}</td>
        </tr>
        <tr>
           <td class="label-col">Payment Method / የክፍያ መንገድ</td>
           <td class="value-col">${data.payment.method}</td>
        </tr>
        <tr>
           <td class="label-col">Status / ሁኔታ</td>
           <td class="value-col">${data.payment.status}</td>
        </tr>
        <tr>
           <td class="label-col">Payment Date / የክፍያ ቀን</td>
           <td class="value-col">${new Date(data.payment.date).toLocaleDateString()}</td>
        </tr>
        <tr>
           <td class="label-col">Payment Reason / የክፍያ ምክንያት</td>
           <td class="value-col">${data.payment.reason}</td>
        </tr>
      </table>
      
      <div class="footer-row">
         <div class="references">
            <h4 style="color: #8cc63f; margin-bottom: 5px;">References</h4>
            <p><strong>System Ref:</strong> ${data.reference.systemRef || 'N/A'}</p>
            <p><strong>Chapa Ref:</strong> ${data.reference.chapaTxId}</p>
            
            <div class="stamps">
               <div class="stamp-circle">
                  <div>PAID<br/>VERIFIED</div>
               </div>
            </div>
         </div>
         
         <div class="amounts">
            <table class="amount-table">
               <tr>
                 <td>Sub Total</td>
                 <td>${data.amount.subtotal.toFixed(2)} ETB</td>
               </tr>
               <tr>
                 <td>Service Charge</td>
                 <td>${data.amount.charge.toFixed(2)} ETB</td>
               </tr>
               <tr>
                 <td class="total-row">Total</td>
                 <td class="total-row">${data.amount.total.toFixed(2)} ETB</td>
               </tr>
            </table>
         </div>
      </div>
      
      <div class="footer-bar">
         <div>
            <span>📞</span> ${data.merchant.supportPhone || '+251-911-123456'}
         </div>
         <div>
            Thank You For Using Medilink
         </div>
         <div>
            <span>✉️</span> ${data.merchant.supportEmail || 'support@medilink.com'}
         </div>
      </div>

    </body>
    </html>
  `;
};

module.exports = { generateReceiptHTML };
