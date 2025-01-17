const puppeteer = require('puppeteer');
const pdfContent = require('./pdfContent');
const logger = require('../logger');

const downloadPDFReport = async (dataPDF) => {
    logger.info('Starting PDF generation process');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    logger.info('New page created in browser');

    const content = await pdfContent(dataPDF);
    logger.info('PDF content generated');

    await page.setContent(content);
    logger.info('Content set in page');

    const buffer = await page.pdf({ format: "A4", landscape: false, margin: { bottom: '24px', top: '24px' }, });
    logger.info('PDF generated');

    await browser.close();
    logger.info('Browser closed');

    return buffer;
}

module.exports = downloadPDFReport;
