// Last-mile: where does the session token live? cookie vs localStorage vs sessionStorage?
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.fill('#email', 'manish123@gmail.com');
  await page.fill('#password', 'Manish9@@');
  await page.click('button#login-btn');
  await page.waitForTimeout(3000);
  console.log('postLoginUrl=', page.url());
  const cookies = await ctx.cookies('https://eventhub.rahulshettyacademy.com/');
  const localStorage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const sessionStorage = await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage)));
  console.log(JSON.stringify({ cookies, localStorageKeys: Object.keys(localStorage), sessionStorageKeys: Object.keys(sessionStorage), localStorage, sessionStorage }, null, 2));

  // Now logout and see what's cleared
  await page.click('button#logout-btn');
  await page.waitForTimeout(2000);
  console.log('postLogoutUrl=', page.url());
  const cookies2 = await ctx.cookies('https://eventhub.rahulshettyacademy.com/');
  const localStorage2 = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const sessionStorage2 = await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage)));
  console.log(JSON.stringify({ cookies2, localStorage2, sessionStorage2 }, null, 2));
  await browser.close();
})();