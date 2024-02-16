const puppeteer = require('puppeteer');
const pdfContent = require('./pdfContent');

const downloadPDFReport = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    const content = await pdfContent();

    await page.setContent(content);

    const buffer = await page.pdf({ format: "A4", landscape: false, margin: { bottom: '24px', top: '24px' }, });

    await browser.close();

    return buffer;
}

module.exports = downloadPDFReport;