// Quick standalone check: confirm the password field type on /login and /register
// in a fresh, pre-auth context.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const loginTypes = await page.$$eval('form input', els => els.map(e => ({ id: e.id, name: e.name, type: e.type, placeholder: e.placeholder })));
  console.log(JSON.stringify({ loginTypes }, null, 2));

  // Try wrong password and screenshot — wider net for error text
  await page.fill('#email', 'manish123@gmail.com');
  await page.fill('#password', 'DefinitelyWrong999');
  await page.click('button#login-btn');
  await page.waitForTimeout(3000);
  const urlAfterWrong = page.url();
  const text = await page.evaluate(() => document.body.innerText);
  // Pull lines that look like error messages
  const candidateErrors = text.split('\n').map(s => s.trim()).filter(l => l && /invalid|incorrect|wrong|fail|credential|password|email|error/i.test(l)).slice(0, 25);
  console.log(JSON.stringify({ urlAfterWrong, candidateErrors }, null, 2));
  await page.screenshot({ path: 'C:\\Users\\kulka\\Downloads\\PlaywrightProject-main\\PlaywrightProject-main\\manual-test-cases\\_tc5-wrong-stdalone.png', fullPage: true });

  // Check register masking
  await page.goto('https://eventhub.rahulshettyacademy.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const regTypes = await page.$$eval('form input', els => els.map(e => ({ id: e.id, type: e.type, placeholder: e.placeholder })));
  console.log(JSON.stringify({ regTypes }, null, 2));
  await browser.close();
})();
