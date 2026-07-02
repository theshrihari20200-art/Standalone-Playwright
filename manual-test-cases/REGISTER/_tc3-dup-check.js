// Standalone: try registering with the seeded email and capture the full page text after submit.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://eventhub.rahulshettyacademy.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.fill('#register-email', 'manish123@gmail.com');
  await page.fill('#register-password', 'Test1234!Aa');
  await page.fill('form input[type="password"]:not(#register-password)', 'Test1234!Aa');
  await page.click('button#register-btn');
  await page.waitForTimeout(3000);
  const url = page.url();
  const text = (await page.evaluate(() => document.body.innerText)).split('\n').map(s => s.trim()).filter(Boolean);
  // Filter for anything that smells like a site error
  const errs = text.filter(l => /exist|already|taken|registered|error|fail|invalid|duplicate/i.test(l));
  console.log(JSON.stringify({ url, errs }, null, 2));
  await page.screenshot({ path: 'C:\\Users\\kulka\\Downloads\\PlaywrightProject-main\\PlaywrightProject-main\\manual-test-cases\\_tc3-dup-stdalone.png', fullPage: true });
  await browser.close();
})();
