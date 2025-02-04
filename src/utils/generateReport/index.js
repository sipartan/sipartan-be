const puppeteer = require('puppeteer');
const pdfContent = require('./pdfContent');
const logger = require('../logger');

const downloadPDFReport = async (dataPDF) => {
    let browser;
    try {
        logger.info('Starting PDF generation process');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',  // Prevent crashes in Docker
                '--disable-software-rasterizer',
                '--disable-crash-reporter',
                '--disable-breakpad',
            ],
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(30000);
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

        await page.close();
        return buffer;
    } catch (error) {
        logger.error('Error during PDF generation:', error);
        throw error;
    } finally {
        if (browser) {
            try {
                await browser.close();  // Ensure browser is closed
                logger.info('Browser closed');
            } catch (closeError) {
                logger.error('Error closing browser:', closeError);
            }
        }
    }
};

// Kill all orphaned Puppeteer processes on exit
process.on('exit', () => {
    logger.info('Exiting process, killing all Puppeteer instances');
    require('child_process').execSync('pkill -f chrome || true');
});

module.exports = downloadPDFReport;
