const puppeteer = require('puppeteer');
const pdfContent = require('./pdfContent');
const logger = require('../logger');

const downloadPDFReport = async (dataPDF) => {
    let browser;
    try {
        logger.info('Starting PDF generation process');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(30000); // Set timeout for all operations
        logger.info('New page created in browser');

        const content = await pdfContent(dataPDF);
        logger.info('PDF content generated');

        await page.setContent(content);
        logger.info('Content set in page');

        const buffer = await page.pdf({
            format: 'A4',
            landscape: false,
            margin: { bottom: '24px', top: '24px' },
        });
        logger.info('PDF generated');

        await page.close(); // Close the page explicitly
        return buffer;
    } catch (error) {
        logger.error('Error during PDF generation:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close(); // Ensure browser is closed
            logger.info('Browser closed');
        }
    }
};

module.exports = downloadPDFReport;
