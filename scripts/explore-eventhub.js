// Playwright exploration script for EventHub Add New Event flow.
// Outputs JSON to stdout describing what it found.
const { chromium } = require('playwright');

const EMAIL = 'manish123@gmail.com';
const PASSWORD = 'Manish9@@';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  const log = [];
  const out = { log, consoleErrors };

  async function snap(tag) {
    log.push(`-- ${tag} :: url=${page.url()} title="${await page.title()}"`);
  }

  try {
    // 1) Open login page
    await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await snap('login page loaded');
    await page.screenshot({ path: 'manual-test-cases/_login.png', fullPage: true });

    // 2) Fill credentials
    await page.getByPlaceholder('Email').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByPlaceholder('Email').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3) Wait for post-login navigation
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      log.push('networkidle wait timed out, continuing');
    }
    await page.waitForTimeout(2000);
    await snap('after sign-in click');
    await page.screenshot({ path: 'manual-test-cases/_post-login.png', fullPage: true });

    // 4) Print body text fragment to confirm we're logged in
    const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
    log.push('BODY FRAGMENT (post-login, first 2000 chars):\n' + bodyText);

    // 5) Hunt for "Add New Event" entry point on current page
    const entryCandidates = [
      page.getByRole('link', { name: /add new event/i }),
      page.getByRole('button', { name: /add new event/i }),
      page.locator('a:has-text("Add New Event")'),
      page.locator('button:has-text("Add New Event")'),
    ];
    let entry = null;
    for (const c of entryCandidates) {
      try {
        const cnt = await c.count();
        if (cnt > 0) { entry = c.first(); log.push(`Found entry candidate, count=${cnt}`); break; }
      } catch (_) {}
    }

    if (!entry) {
      // try any link/button containing "event" or "create"
      const fallback = page.locator('a, button').filter({ hasText: /event|create/i });
      const fbCount = await fallback.count();
      log.push(`Fallback event/create links count=${fbCount}`);
      for (let i = 0; i < Math.min(fbCount, 20); i++) {
        const t = (await fallback.nth(i).innerText().catch(() => '')).trim();
        const h = await fallback.nth(i).getAttribute('href').catch(() => null);
        log.push(`  fallback[${i}] text="${t}" href=${h}`);
      }
    }

    // Try navigating directly to /addEvent or /events/new
    const candidateUrls = [
      'https://eventhub.rahulshettyacademy.com/addEvent',
      'https://eventhub.rahulshettyacademy.com/events/new',
      'https://eventhub.rahulshettyacademy.com/create-event',
      'https://eventhub.rahulshettyacademy.com/add-event',
    ];
    let addEventPageReached = null;
    for (const u of candidateUrls) {
      try {
        const resp = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const status = resp ? resp.status() : 'no-resp';
        const title = await page.title();
        const u2 = page.url();
        const bodyFragment = (await page.locator('body').innerText()).slice(0, 800);
        log.push(`Probe ${u} => status=${status} finalUrl=${u2} title="${title}"`);
        if (status === 200 && !/login/i.test(u2)) {
          // check if there are form inputs that look like an event form
          const inputs = await page.locator('input, textarea, select').count();
          log.push(`  inputs/selects/textarea count=${inputs}`);
          if (inputs > 1) {
            addEventPageReached = u;
            log.push(`  candidate Add Event page reached: ${u}`);
            break;
          }
        }
      } catch (e) {
        log.push(`Probe ${u} threw: ${e.message}`);
      }
    }

    if (!addEventPageReached && entry) {
      log.push('Clicking located entry link...');
      await entry.click();
      await page.waitForTimeout(2000);
      await snap('after entry click');
      await page.screenshot({ path: 'manual-test-cases/_add-event.png', fullPage: true });
      addEventPageReached = page.url();
    } else if (addEventPageReached) {
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'manual-test-cases/_add-event.png', fullPage: true });
    }

    // 6) Enumerate every form field on the Add Event page
    const fieldsData = [];
    const inputs = await page.locator('input, textarea, select').all();
    for (const el of inputs) {
      try {
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const type = await el.getAttribute('type');
        const name = await el.getAttribute('name');
        const id = await el.getAttribute('id');
        const placeholder = await el.getAttribute('placeholder');
        const required = await el.getAttribute('required');
        const ariaRequired = await el.getAttribute('aria-required');
        const value = await el.inputValue().catch(() => null);
        const visible = await el.isVisible();
        // Try to find a label
        let label = '';
        if (id) {
          const lbl = await page.locator(`label[for="${id}"]`).first().innerText().catch(() => '');
          if (lbl) label = lbl.trim();
        }
        if (!label) {
          // Look for parent label
          const parentLbl = await el.evaluateHandle(e => e.closest('label'));
          if (parentLbl) {
            const t = await parentLbl.evaluate(e => (e || {}).innerText || '');
            if (t) label = t.trim();
          }
        }
        if (!label) {
          // preceding sibling text
          const precedingText = await el.evaluate(e => {
            const prev = e.previousElementSibling;
            return prev ? (prev.innerText || prev.textContent || '') : '';
          });
          if (precedingText) label = precedingText.trim().slice(0, 80);
        }
        fieldsData.push({
          tag, type, name, id, placeholder, required: required !== null || ariaRequired === 'true',
          requiredAttr: required, ariaRequired, value, visible, label: label.slice(0, 120),
        });
      } catch (e) {
        fieldsData.push({ error: e.message });
      }
    }
    out.fieldsData = fieldsData;

    // 7) Look for buttons (submit, cancel)
    const buttons = await page.locator('button, input[type="submit"], a[role="button"]').all();
    const buttonsData = [];
    for (const b of buttons) {
      try {
        const t = (await b.innerText().catch(() => '')).trim();
        const type = await b.getAttribute('type');
        const visible = await b.isVisible();
        buttonsData.push({ text: t, type, visible });
      } catch (_) {}
    }
    out.buttonsData = buttonsData;

    // 8) Dump body fragment of add event page
    const addBody = (await page.locator('body').innerText()).slice(0, 4000);
    out.addEventBodyFragment = addBody;

    // 9) Get the full outerHTML of the form area for richer analysis
    const formOuter = await page.locator('form').first().evaluate(f => f.outerHTML).catch(() => null);
    out.formOuterHtml = formOuter ? formOuter.slice(0, 6000) : null;

    out.finalUrl = page.url();
  } catch (e) {
    out.fatalError = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();
