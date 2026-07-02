// Happy-path submission using attribute selectors to dodge weird IDs.
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
    await page.goto('https://eventhub.rahulshettyacademy.com/admin/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Use attribute selectors to dodge IDs with & and $
    await page.locator('input[id="event-title-input"]').fill('QA Conference 2026');
    await page.locator('textarea[placeholder="Describe the event…"]').fill('A great QA conference covering automation, accessibility, and AI.');
    await page.locator('select[id="category"]').selectOption({ label: 'Conference' });
    await page.locator('input[id="city"]').fill('Bangalore');
    await page.locator('input[id="venue"]').fill('Kanteerava Indoor Stadium, Bangalore');
    await page.locator('input[type="datetime-local"]').fill('2027-08-15T09:30');
    await page.locator('input[type="number"]').nth(0).fill('499');      // price
    await page.locator('input[type="number"]').nth(1).fill('500');      // seats
    await page.locator('input[type="url"]').fill('https://picsum.photos/seed/qa2026/800/400');
    await page.screenshot({ path: 'manual-test-cases/_filled-happy.png', fullPage: true });

    const eventsBefore = await page.locator('table tbody tr').count();
    log('events before happy submit=', eventsBefore);

    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(3500);

    const eventsAfter = await page.locator('table tbody tr').count();
    log('events after happy submit=', eventsAfter);

    // Look for any toast/notification/success message
    const toastSelectors = ['[role="status"]', '[role="alert"]', '.toast', '.notification', '.text-green-500', '.text-green-600', '.text-green-700', '.text-emerald-500', '.text-emerald-600'];
    const toasts = [];
    for (const sel of toastSelectors) {
      const els = await page.locator(sel).all();
      for (const el of els) {
        const t = (await el.innerText().catch(() => '')).trim();
        const v = await el.isVisible().catch(() => false);
        if (t && v) toasts.push(`${sel}: ${t}`);
      }
    }
    out.toasts = toasts;
    log('toasts=', JSON.stringify(toasts));

    // Was our title added?
    const titleInTable = await page.locator('table tbody tr:has-text("QA Conference 2026")').count();
    log('"QA Conference 2026" rows in table=', titleInTable);

    // Form cleared after success?
    const titleValAfter = await page.locator('input[id="event-title-input"]').inputValue();
    log('title input after submit=', JSON.stringify(titleValAfter));
    const cityValAfter = await page.locator('input[id="city"]').inputValue();
    log('city input after submit=', JSON.stringify(cityValAfter));

    await page.screenshot({ path: 'manual-test-cases/_after-happy-submit.png', fullPage: true });

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();