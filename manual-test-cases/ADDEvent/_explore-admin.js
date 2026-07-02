// Probe /admin/events for the Add New Event entry point.
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

    const resp = await page.goto('https://eventhub.rahulshettyacademy.com/admin/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
    log('admin/events status=', resp ? resp.status() : 'none', 'url=', page.url());
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'manual-test-cases/_admin-events.png', fullPage: true });
    log('BODY-FRAGMENT:\n' + (await page.locator('body').innerText()).slice(0, 5000));

    const candidates = [
      page.getByRole('link', { name: /add new event/i }),
      page.getByRole('button', { name: /add new event/i }),
      page.locator('a:has-text("Add New Event")'),
      page.locator('button:has-text("Add New Event")'),
      page.locator('a:has-text("Add Event")'),
      page.locator('button:has-text("Add Event")'),
      page.locator('a:has-text("Create Event")'),
      page.locator('button:has-text("Create Event")'),
    ];
    for (const c of candidates) {
      const cnt = await c.count().catch(() => 0);
      if (cnt > 0) {
        log(`candidate selector count=${cnt}`);
        for (let i = 0; i < cnt; i++) {
          const t = (await c.nth(i).innerText().catch(() => '')).trim();
          const h = await c.nth(i).getAttribute('href').catch(() => null);
          log(`  candidate[${i}] text="${t}" href=${h}`);
        }
      }
    }

    const allLinks = await page.locator('a, button').all();
    log(`total links+buttons=${allLinks.length}`);
    for (let i = 0; i < Math.min(allLinks.length, 80); i++) {
      const t = (await allLinks[i].innerText().catch(() => '')).trim();
      const h = await allLinks[i].getAttribute('href').catch(() => null);
      const type = await allLinks[i].getAttribute('type').catch(() => null);
      const visible = await allLinks[i].isVisible().catch(() => false);
      if (t || h) log(`  link[${i}] visible=${visible} text="${t.slice(0,60)}" href=${h} type=${type}`);
    }

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();
