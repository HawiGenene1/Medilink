const fs = require('fs');
const path = require('path');
const { generateReceiptHTML } = require('./receiptTemplate');

/**
 * Generates a PDF receipt for the given data
 * @param {Object} data - Receipt data
 * @param {String} invoiceNumber - Used for filename
 * @returns {Promise<String>} - Path to generated PDF relative to public folder, e.g., '/uploads/invoices/...'
 */
const generateReceiptPDF = async (data, invoiceNumber) => {
    let puppeteer;
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        console.error('Puppeteer not installed or failed to load. Skipping PDF generation.');
        return null;
    }

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some server environments
        });

        const page = await browser.newPage();
        const htmlContent = generateReceiptHTML(data);

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Ensure directory exists
        const uploadDir = path.join(__dirname, '../../uploads/invoices');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `RECEIPT-${invoiceNumber}.pdf`;
        const filePath = path.join(uploadDir, filename);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        });

        await browser.close();

        // Return relative path for URL
        return `/uploads/invoices/${filename}`;
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        throw new Error('Failed to generate PDF receipt');
    }
};

module.exports = { generateReceiptPDF };
