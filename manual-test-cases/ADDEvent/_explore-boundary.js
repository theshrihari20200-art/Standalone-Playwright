// Boundary / invalid input tests.
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

  async function login() {
    await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByPlaceholder('Email').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(3000);
    await page.goto('https://eventhub.rahulshettyacademy.com/admin/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  async function clearForm() {
    await page.locator('input[id="event-title-input"]').fill('');
    await page.locator('textarea[placeholder="Describe the event…"]').fill('');
    await page.locator('select[id="category"]').selectOption({ index: 0 });
    await page.locator('input[id="city"]').fill('');
    await page.locator('input[id="venue"]').fill('');
    await page.locator('input[type="datetime-local"]').fill('');
    await page.locator('input[type="number"]').nth(0).fill('');
    await page.locator('input[type="number"]').nth(1).fill('');
    await page.locator('input[type="url"]').fill('');
  }

  async function readVisibleErrorTexts() {
    const errorSelectors = ['.text-red-500', '.text-red-600', '.text-red-700', '.text-rose-500', '.text-rose-600', '[role="alert"]'];
    const found = [];
    for (const sel of errorSelectors) {
      const els = await page.locator(sel).all();
      for (const el of els) {
        const t = (await el.innerText().catch(() => '')).trim();
        const v = await el.isVisible().catch(() => false);
        if (t && v && t.length < 200) found.push(`${sel}: ${t}`);
      }
    }
    return [...new Set(found)];
  }

  try {
    await login();

    // ----- BOUNDARY 1: past date -----
    log('---- BOUNDARY: past date ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Past Event Test');
    await page.locator('input[id="city"]').fill('Mumbai');
    await page.locator('input[id="venue"]').fill('Test Venue');
    await page.locator('input[type="datetime-local"]').fill('2020-01-15T10:00'); // past
    await page.locator('input[type="number"]').nth(0).fill('100');
    await page.locator('input[type="number"]').nth(1).fill('50');
    const beforeRows = await page.locator('table tbody tr').count();
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const afterRows = await page.locator('table tbody tr').count();
    log('rows before/after past-date submit=', beforeRows, '/', afterRows);
    const errs1 = await readVisibleErrorTexts();
    log('errors after past-date submit=', JSON.stringify(errs1));
    const titleInTable1 = await page.locator('table tbody tr:has-text("Past Event Test")').count();
    log('Past Event Test rows=', titleInTable1);
    await page.screenshot({ path: 'manual-test-cases/_past-date.png', fullPage: true });

    // ----- BOUNDARY 2: zero seats -----
    log('---- BOUNDARY: zero seats ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Zero Seats Test');
    await page.locator('input[id="city"]').fill('Mumbai');
    await page.locator('input[id="venue"]').fill('Test Venue');
    await page.locator('input[type="datetime-local"]').fill('2027-09-15T10:00');
    await page.locator('input[type="number"]').nth(0).fill('100');
    await page.locator('input[type="number"]').nth(1).fill('0');   // 0 seats — should fail (min=1)
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const errs2 = await readVisibleErrorTexts();
    log('errors after zero-seats submit=', JSON.stringify(errs2));
    const titleInTable2 = await page.locator('table tbody tr:has-text("Zero Seats Test")').count();
    log('Zero Seats Test rows=', titleInTable2);

    // ----- BOUNDARY 3: invalid image URL -----
    log('---- BOUNDARY: invalid image URL ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Bad URL Test');
    await page.locator('input[id="city"]').fill('Mumbai');
    await page.locator('input[id="venue"]').fill('Test Venue');
    await page.locator('input[type="datetime-local"]').fill('2027-10-15T10:00');
    await page.locator('input[type="number"]').nth(0).fill('100');
    await page.locator('input[type="number"]').nth(1).fill('50');
    await page.locator('input[type="url"]').fill('not-a-url');
    const rowsBeforeBadUrl = await page.locator('table tbody tr').count();
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const rowsAfterBadUrl = await page.locator('table tbody tr').count();
    log('rows before/after bad-URL submit=', rowsBeforeBadUrl, '/', rowsAfterBadUrl);
    const errs3 = await readVisibleErrorTexts();
    log('errors after bad-URL submit=', JSON.stringify(errs3));
    const titleInTable3 = await page.locator('table tbody tr:has-text("Bad URL Test")').count();
    log('Bad URL Test rows=', titleInTable3);

    // ----- BOUNDARY 4: negative price -----
    log('---- BOUNDARY: negative price ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Negative Price Test');
    await page.locator('input[id="city"]').fill('Mumbai');
    await page.locator('input[id="venue"]').fill('Test Venue');
    await page.locator('input[type="datetime-local"]').fill('2027-11-15T10:00');
    await page.locator('input[type="number"]').nth(0).fill('-50');
    await page.locator('input[type="number"]').nth(1).fill('50');
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const errs4 = await readVisibleErrorTexts();
    log('errors after negative-price submit=', JSON.stringify(errs4));
    const titleInTable4 = await page.locator('table tbody tr:has-text("Negative Price Test")').count();
    log('Negative Price Test rows=', titleInTable4);

    // ----- OPTIONAL FIELDS: happy with optionals left blank, then with them filled -----
    log('---- OPTIONAL: without optional fields ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Minimal Event Test');
    await page.locator('input[id="city"]').fill('Delhi');
    await page.locator('input[id="venue"]').fill('Somewhere, Delhi');
    await page.locator('input[type="datetime-local"]').fill('2027-12-01T08:00');
    await page.locator('input[type="number"]').nth(0).fill('0');
    await page.locator('input[type="number"]').nth(1).fill('100');
    // leave description + image URL blank
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const minimalInTable = await page.locator('table tbody tr:has-text("Minimal Event Test")').count();
    log('Minimal Event Test rows (no optionals)=', minimalInTable);
    await page.screenshot({ path: 'manual-test-cases/_optional-empty.png', fullPage: true });

    log('---- OPTIONAL: with all optionals ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Full Optional Event');
    await page.locator('textarea[placeholder="Describe the event…"]').fill('Event with all optional fields populated for verification.');
    await page.locator('select[id="category"]').selectOption({ label: 'Festival' });
    await page.locator('input[id="city"]').fill('Pune');
    await page.locator('input[id="venue"]').fill('Full Venue Address, Pune');
    await page.locator('input[type="datetime-local"]').fill('2027-12-15T14:00');
    await page.locator('input[type="number"]').nth(0).fill('250');
    await page.locator('input[type="number"]').nth(1).fill('250');
    await page.locator('input[type="url"]').fill('https://picsum.photos/seed/fullopt/1200/600');
    await page.locator('button#add-event-btn').click();
    await page.waitForTimeout(2500);
    const fullInTable = await page.locator('table tbody tr:has-text("Full Optional Event")').count();
    log('Full Optional Event rows=', fullInTable);
    await page.screenshot({ path: 'manual-test-cases/_optional-filled.png', fullPage: true });

    // ----- NAVIGATION: cancel/back -----
    log('---- NAVIGATION: browser back after partial fill ----');
    await clearForm();
    await page.locator('input[id="event-title-input"]').fill('Unfinished Event');
    await page.locator('input[id="city"]').fill('X');
    await page.locator('input[id="venue"]').fill('Y');
    // note: no Cancel button on the form
    // Try clicking the EventHub logo to navigate away
    const homeLink = page.locator('a:has-text("EventHub")').first();
    await homeLink.click();
    await page.waitForTimeout(2000);
    log('url after clicking EventHub logo=', page.url());
    // Then go back to admin/events and check if form is dirty
    await page.goBack();
    await page.waitForTimeout(2000);
    log('url after goBack=', page.url());
    const dirtyTitle = await page.locator('input[id="event-title-input"]').inputValue().catch(() => 'n/a');
    log('title after back-nav=', JSON.stringify(dirtyTitle));

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();