const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF report from HTML content
 * @param {String} htmlContent - HTML string
 * @param {String} filename - Output filename (without extension)
 * @returns {Promise<String>} - Relative path to generated PDF
 */
const generateReportPDF = async (htmlContent, filename) => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Ensure directory exists
        const uploadDir = path.join(__dirname, '../../uploads/reports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fullFilename = `${filename}.pdf`;
        const filePath = path.join(uploadDir, fullFilename);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        return `/uploads/reports/${fullFilename}`;
    } catch (error) {
        console.error('Puppeteer Report Generation Error:', error);
        throw new Error('Failed to generate PDF report');
    }
};

module.exports = { generateReportPDF };
