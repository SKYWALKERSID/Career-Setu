const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function exportPDF() {
  const htmlPath = path.resolve(__dirname, '..', 'docs', 'presentation-deck.html');
  const outputPath = path.resolve(__dirname, '..', 'docs', 'CareerSetu_Master_Deck.pdf');

  console.log('Loading presentation deck from:', htmlPath);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle',
  });

  // Emulate print media
  await page.emulateMedia({ media: 'print' });

  console.log('Generating 16:9 widescreen PDF...');
  await page.pdf({
    path: outputPath,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  await browser.close();
  const stats = fs.statSync(outputPath);
  console.log(`PDF successfully generated: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

exportPDF().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
