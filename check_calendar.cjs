const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const screenshotPath = 'C:\\Users\\rodfa\\AppData\\Local\\Temp\\claude\\C--Users-rodfa-claude-cli\\2390b2cb-bb46-4278-91c6-167256693845\\scratchpad\\calendar-view.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.click('text=Today');
  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath.replace('.png', '-today.png'), fullPage: true });

  await page.click('text=Premier League');
  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath.replace('.png', '-prem-on.png'), fullPage: true });

  for (let i = 0; i < 12; i++) {
    await page.click('.fc-prev-button');
    await page.waitForTimeout(150);
  }
  await page.click('.fc-next-button');
  await page.waitForTimeout(400);
  await page.screenshot({ path: screenshotPath.replace('.png', '-aug2025-prem-on.png'), fullPage: true });

  console.log('TITLE:', await page.title());
  console.log('ERRORS:', JSON.stringify(errors, null, 2));

  await browser.close();
})();
