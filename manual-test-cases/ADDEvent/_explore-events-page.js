// Verify the QA Conference 2026 event we created earlier shows on /events with its description and image.
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
    log('events page body fragment:\n' + (await page.locator('body').innerText()).slice(0, 4000));
    const qaCount = await page.locator('text=/QA Conference 2026/').count();
    log('"QA Conference 2026" on /events count=', qaCount);

    // Also visit /admin/events to confirm table state
    await page.goto('https://eventhub.rahulshettyacademy.com/admin/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const tableRows = await page.locator('table tbody tr').count();
    log('admin/events table rows=', tableRows);

    // Dump table row text snippets
    const rows = await page.locator('table tbody tr').all();
    const rowSnippets = [];
    for (let i = 0; i < rows.length; i++) {
      const t = (await rows[i].innerText().catch(() => '')).trim().replace(/\s+/g, ' ');
      rowSnippets.push(`[${i}] ${t}`);
    }
    out.tableRows = rowSnippets;
    log('row snippets:\n' + rowSnippets.join('\n'));

    // Capture full screenshot
    await page.screenshot({ path: 'manual-test-cases/_final-admin.png', fullPage: true });

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();