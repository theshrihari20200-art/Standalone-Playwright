// Manual exploration: discover the Register page, list form fields, observe login + post-auth + logout
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\Users\\kulka\\Downloads\\PlaywrightProject-main\\PlaywrightProject-main\\manual-test-cases';

function stamp() { return new Date().toISOString(); }
function logLine(o) {
  const line = `[${stamp()}] ${typeof o === 'string' ? o : JSON.stringify(o)}`;
  console.log(line);
  fs.appendFileSync(path.join(OUT, '_run.log'), line + '\n');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

  // 1. Public homepage
  logLine('NAV home');
  await page.goto('https://eventhub.rahulshettyacademy.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  logLine({ url: page.url(), title: await page.title() });

  // 1a. Try direct /register
  logLine('NAV /register');
  const r1 = await page.goto('https://eventhub.rahulshettyacademy.com/register', { waitUntil: 'domcontentloaded' });
  logLine({ status: r1 && r1.status(), finalUrl: page.url(), title: await page.title() });
  await page.waitForTimeout(1500);

  // 1b. Capture full HTML for analysis
  const registerHtml = await page.content();
  fs.writeFileSync(path.join(OUT, '_register-page.html'), registerHtml);
  logLine('register html length=' + registerHtml.length);

  // 1c. Inspect forms
  const forms = await page.$$eval('form', (els) => els.map(f => ({
    action: f.getAttribute('action'),
    method: f.getAttribute('method'),
    novalidate: f.hasAttribute('novalidate'),
    id: f.id || null,
    dataTestid: f.getAttribute('data-testid') || null,
    innerLength: f.outerHTML.length,
  })));
  logLine({ formsCount: forms.length, forms });

  // 1d. Inspect inputs/selects/textareas/buttons
  const fields = await page.$$eval('form input, form select, form textarea, form button, form [role="button"]', (els) => els.map((el) => {
    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type') || null;
    const name = el.getAttribute('name') || null;
    const id = el.id || null;
    const placeholder = el.getAttribute('placeholder') || null;
    const required = el.hasAttribute('required');
    const ariaRequired = el.getAttribute('aria-required');
    const minLength = el.getAttribute('minlength') || el.getAttribute('minLength') || null;
    const maxLength = el.getAttribute('maxlength') || el.getAttribute('maxLength') || null;
    const pattern = el.getAttribute('pattern') || null;
    const min = el.getAttribute('min') || null;
    const max = el.getAttribute('max') || null;
    const step = el.getAttribute('step') || null;
    const value = el.value || null;
    const accept = el.getAttribute('accept') || null;
    const multiple = el.hasAttribute('multiple');
    const role = el.getAttribute('role') || null;
    let options = null;
    if (tag === 'select') {
      options = Array.from(el.querySelectorAll('option')).map((o) => ({
        value: o.value, text: o.textContent, selected: o.selected, disabled: o.disabled,
      }));
    }
    let text = null;
    if (tag === 'button') text = el.textContent.trim();
    return { tag, type, name, id, placeholder, required, ariaRequired, minLength, maxLength, pattern, min, max, step, value, accept, multiple, role, options, text };
  }));
  logLine({ fieldsCount: fields.length, fields });

  // 1e. Labels for form fields
  const labels = await page.$$eval('form label, form [for]', (els) => els.map(l => ({
    for: l.getAttribute('for') || null,
    text: l.textContent.trim(),
    requiredMarker: l.innerHTML.includes('text-red-500') || l.innerHTML.includes('*') || null,
    requiredAria: l.getAttribute('aria-required') || null,
  })));
  logLine({ labelsCount: labels.length, labels });

  // 1f. Submit empty form, capture per-field validity + visible text near the field
  const beforeUrl = page.url();
  logLine({ beforeEmptySubmit: beforeUrl });
  // Find submit button
  let submitHandle = await page.$('form button[type="submit"]');
  if (!submitHandle) {
    submitHandle = await page.$('form button');
  }
  if (submitHandle) {
    await submitHandle.click().catch(e => logLine('submit click err=' + e.message));
  } else {
    logLine('no submit button found');
  }
  await page.waitForTimeout(2000);
  logLine({ afterEmptySubmitUrl: page.url(), title: await page.title() });
  const validity = await page.$$eval('form input, form select, form textarea', (els) => els.map((el) => {
    const v = el.validity;
    return {
      id: el.id || null, name: el.getAttribute('name') || null,
      valid: v.valid, valueMissing: v.valueMissing, typeMismatch: v.typeMismatch,
      patternMismatch: v.patternMismatch, tooShort: v.tooShort, tooLong: v.tooLong,
      rangeUnderflow: v.rangeUnderflow, rangeOverflow: v.rangeOverflow,
      stepMismatch: v.stepMismatch, badInput: v.badInput,
      validationMessage: el.validationMessage,
    };
  }));
  logLine({ validity });
  // Look for any "error" or alert text on the page
  const errorTexts = await page.$$eval('[role="alert"], .text-red-500, .text-red-600, .error, .error-message, [data-testid*="error"]', els => els.map(e => e.textContent.trim()).filter(Boolean));
  logLine({ emptySubmitErrorTexts: errorTexts });
  await page.screenshot({ path: path.join(OUT, '_register-empty.png'), fullPage: true });

  // 1g. List all clickable links in nav / header / footer
  const links = await page.$$eval('a, button', (els) => els.map(el => ({
    text: (el.textContent || '').trim().slice(0, 80),
    href: el.getAttribute('href') || null,
    role: el.getAttribute('role') || null,
    dataTestid: el.getAttribute('data-testid') || null,
    classes: (el.getAttribute('class') || '').slice(0, 100),
  })));
  logLine({ linksCount: links.length, links });

  // 2. Try login page from register page (header link?)
  const loginLinkHref = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    const m = anchors.find(a => /log\s*in|sign\s*in/i.test(a.textContent || ''));
    return m ? m.getAttribute('href') : null;
  });
  logLine({ loginLinkFromRegister: loginLinkHref });

  // 3. Visit /login
  logLine('NAV /login');
  await page.goto('https://eventhub.rahulshettyacademy.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  logLine({ url: page.url(), title: await page.title() });
  await page.screenshot({ path: path.join(OUT, '_login-page.png'), fullPage: true });

  const loginForm = await page.$$eval('form input, form select, form textarea, form button', (els) => els.map((el) => {
    const tag = el.tagName.toLowerCase();
    return {
      tag, type: el.getAttribute('type') || null, name: el.getAttribute('name') || null,
      id: el.id || null, placeholder: el.getAttribute('placeholder') || null,
      required: el.hasAttribute('required'), text: tag === 'button' ? el.textContent.trim() : null,
    };
  }));
  logLine({ loginForm });

  const loginLabels = await page.$$eval('form label', (els) => els.map(l => ({
    for: l.getAttribute('for') || null, text: l.textContent.trim(),
    requiredMarker: l.innerHTML.includes('text-red-500') || l.innerHTML.includes('*'),
  })));
  logLine({ loginLabels });

  // 4. Try logging in with WRONG password for the seeded user, capture error
  logLine('attempt login with WRONG password');
  const emailSel = '#email, input[name="email"], input[type="email"]';
  const passSel = 'input[type="password"]';
  const emailLocator = page.locator(emailSel).first();
  await emailLocator.waitFor({ state: 'visible', timeout: 10000 });
  await emailLocator.fill('manish123@gmail.com');
  await page.locator(passSel).first().fill('WrongPassword123!');
  const submitBtn = page.locator('form button[type="submit"]').first();
  await submitBtn.click().catch(e => logLine('login submit err=' + e.message));
  await page.waitForTimeout(3000);
  logLine({ afterWrongLogin: page.url(), title: await page.title() });
  const wrongLoginErrors = await page.$$eval('[role="alert"], .text-red-500, .text-red-600, .error, .error-message, [data-testid*="error"]', els => els.map(e => e.textContent.trim()).filter(Boolean));
  logLine({ wrongLoginErrors });
  await page.screenshot({ path: path.join(OUT, '_login-wrong.png'), fullPage: true });

  // 5. Now do a happy login with the seeded creds
  logLine('attempt login with correct seeded creds');
  await emailLocator.fill('manish123@gmail.com');
  await page.locator(passSel).first().fill('Manish9@@');
  await submitBtn.click();
  await page.waitForTimeout(3000);
  logLine({ afterCorrectLogin: page.url(), title: await page.title() });
  await page.screenshot({ path: path.join(OUT, '_login-success.png'), fullPage: true });

  // Inspect header for the email and the Logout affordance
  const headerContent = await page.$eval('header, nav, body', (el) => {
    // Try to get the top nav area
    const h = document.querySelector('header');
    return h ? h.innerText : el.innerText;
  });
  logLine({ headerContent: headerContent.slice(0, 1200) });

  // Find the logout link/button
  const logoutCandidates = await page.$$eval('a, button', els => els.filter(e => /logout|sign\s*out/i.test(e.textContent || '')).map(e => ({
    text: e.textContent.trim(), href: e.getAttribute('href') || null,
    tag: e.tagName.toLowerCase(), id: e.id || null, dataTestid: e.getAttribute('data-testid') || null,
  })));
  logLine({ logoutCandidates });

  // 6. Now click logout
  if (logoutCandidates.length) {
    logLine('clicking logout');
    // pick the first match
    const sel = logoutCandidates[0].tag === 'a'
      ? `a:has-text("${logoutCandidates[0].text}")`
      : `button:has-text("${logoutCandidates[0].text}")`;
    await page.locator(sel).first().click();
    await page.waitForTimeout(2000);
    logLine({ afterLogout: page.url(), title: await page.title() });
    await page.screenshot({ path: path.join(OUT, '_after-logout.png'), fullPage: true });
  } else {
    logLine('NO LOGOUT AFFORDANCE FOUND');
  }

  // 7. Test that session is gone — try accessing /events or /bookings
  logLine('check session after logout');
  const r2 = await page.goto('https://eventhub.rahulshettyacademy.com/bookings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  logLine({ afterLogoutBookings: page.url(), title: await page.title() });

  // 8. Save the registered email pattern check: visit register again, fill it, and submit
  logLine('REVISIT /register for happy path');
  await page.goto('https://eventhub.rahulshettyacademy.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  logLine({ reRegisterUrl: page.url(), title: await page.title() });

  // List input selectors from register page
  const regFieldsNow = await page.$$eval('form input, form select, form textarea, form button', (els) => els.map((el) => {
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || null,
      name: el.getAttribute('name') || null,
      id: el.id || null,
      placeholder: el.getAttribute('placeholder') || null,
      text: el.tagName.toLowerCase() === 'button' ? el.textContent.trim() : null,
    };
  }));
  logLine({ regFieldsNow });

  await browser.close();
  logLine('DONE');
  logLine({ consoleErrors });
})();
