// Check whether "Add New Event" on /events is a link/button to /admin/events.
const { chromium } = require('playwright');
const EMAIL = 'manish123@gmail.com';
const PASSWORD = 'Manish9@@';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  const out = { consoleErrors, log: [] };
  function log(...a) { out.log.push(a.join(' ')); }

  try {
    await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByPlaceholder('Email').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(3000);

    await page.goto('https://eventhub.rahulshettyacademy.com/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const candidates = page.locator('text=/Add New Event/i');
    const cnt = await candidates.count();
    log('"Add New Event" matches on /events=', cnt);
    for (let i = 0; i < cnt; i++) {
      const tag = await candidates.nth(i).evaluate(e => e.tagName);
      const role = await candidates.nth(i).getAttribute('role');
      const href = await candidates.nth(i).getAttribute('href');
      const cls = await candidates.nth(i).getAttribute('class');
      const text = (await candidates.nth(i).innerText()).trim();
      log(`  [${i}] tag=${tag} role=${role} href=${href} text="${text}" class="${(cls||'').slice(0,80)}"`);
    }

    // Try clicking the first one
    if (cnt > 0) {
      await candidates.first().click().catch(e => log('click err: ' + e.message));
      await page.waitForTimeout(2000);
      log('url after clicking first Add New Event on /events=', page.url());
    }

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();