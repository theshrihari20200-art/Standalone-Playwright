// Inspect the inline Add Event form on /admin/events in detail.
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

    // Find the form
    const formCount = await page.locator('form').count();
    log('form count=', formCount);

    // Dump every form's outerHTML (truncated)
    for (let i = 0; i < formCount; i++) {
      const html = await page.locator('form').nth(i).evaluate(f => f.outerHTML);
      log(`form[${i}] html length=${html.length}`);
      log(html.slice(0, 8000));
      log('---');
    }

    // Enumerate inputs/textareas/selects
    const fields = await page.locator('form input, form textarea, form select').all();
    log('form fields count=', fields.length);
    const fieldData = [];
    for (const el of fields) {
      const d = await el.evaluate(e => {
        const t = e.tagName.toLowerCase();
        return {
          tag: t,
          type: e.getAttribute('type'),
          name: e.getAttribute('name'),
          id: e.getAttribute('id'),
          placeholder: e.getAttribute('placeholder'),
          required: e.hasAttribute('required'),
          ariaRequired: e.getAttribute('aria-required'),
          min: e.getAttribute('min'),
          max: e.getAttribute('max'),
          maxLength: e.getAttribute('maxlength'),
          minLength: e.getAttribute('minlength'),
          pattern: e.getAttribute('pattern'),
          accept: e.getAttribute('accept'),
          multiple: e.hasAttribute('multiple'),
          value: e.value,
          options: t === 'select' ? Array.from(e.options).map(o => ({ value: o.value, text: o.textContent.trim(), selected: o.selected })) : null,
        };
      });
      fieldData.push(d);
    }
    out.fieldData = fieldData;

    // Submit empty form to see validation
    const addBtn = page.locator('form button[type="submit"]');
    log('submit button count=', await addBtn.count(), 'text=', await addBtn.first().innerText().catch(() => ''));

    // Capture the number of events listed BEFORE submission
    const eventsBeforeCount = await page.locator('table tbody tr').count();
    log('events before submission=', eventsBeforeCount);

    // Click submit on empty form
    await addBtn.first().click();
    await page.waitForTimeout(1500);

    // Check for HTML5 validation messages by reading validity on each field
    const validationMessages = [];
    for (let i = 0; i < fields.length; i++) {
      const v = await fields[i].evaluate(e => {
        const val = e.validity;
        return {
          valid: val.valid,
          valueMissing: val.valueMissing,
          typeMismatch: val.typeMismatch,
          patternMismatch: val.patternMismatch,
          tooShort: val.tooShort,
          tooLong: val.tooLong,
          rangeUnderflow: val.rangeUnderflow,
          rangeOverflow: val.rangeOverflow,
          stepMismatch: val.stepMismatch,
          badInput: val.badInput,
          validationMessage: e.validationMessage,
          name: e.getAttribute('name'),
          id: e.getAttribute('id'),
        };
      });
      validationMessages.push(v);
    }
    out.emptySubmitValidation = validationMessages;

    // Take a screenshot of the empty-submit state
    await page.screenshot({ path: 'manual-test-cases/_empty-submit.png', fullPage: true });

    // Look for any explicit error text shown after submit
    const errorTexts = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600, .text-red-700, .text-destructive, [data-error]').all();
    const errorFragments = [];
    for (const el of errorTexts) {
      const t = (await el.innerText().catch(() => '')).trim();
      const v = await el.isVisible().catch(() => false);
      if (t && v) errorFragments.push(t);
    }
    out.emptySubmitErrorTexts = errorFragments;

    // Check URL didn't change
    log('url after empty submit=', page.url());

    out.finalUrl = page.url();
  } catch (e) {
    out.fatal = e.message + '\n' + e.stack;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await browser.close();
  }
})();
