/**
 * Generate a multiple-cucumber-html-reporter HTML report from the JSON
 * output written by `npm test`.
 *
 * Usage:
 *   npm run test:report
 * or:
 *   node scripts/generate-report.js
 *
 * Reads:    reports/cucumber-report.json
 * Writes:   reports/cucumber-report.html (+ assets)
 */

const fs = require('fs-extra');
const path = require('path');
const reporter = require('multiple-cucumber-html-reporter');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const JSON_REPORT = path.join(REPORT_DIR, 'cucumber-report.json');

(async () => {
  if (!(await fs.pathExists(JSON_REPORT))) {
    console.error(`[generate-report] No JSON report found at ${JSON_REPORT}.`);
    console.error('[generate-report] Run `npm test` first.');
    process.exit(1);
  }

  await fs.ensureDir(REPORT_DIR);

  reporter.generate({
    jsonDir: REPORT_DIR,
    reportPath: path.join(REPORT_DIR, 'html'),
    reportName: 'EventHub – Add New Event',
    pageTitle: 'EventHub – Add New Event Report',
    metadata: {
      browser: {
        name: 'chromium',
        version: 'latest',
      },
      device: 'Local',
      platform: {
        name: process.platform,
        version: process.platform === 'win32' ? process.env.OS_VERSION || 'windows' : process.platform,
      },
    },
  });

  // multiple-cucumber-html-reporter writes reports/html/index.html. Copy a
  // convenience link at reports/cucumber-report.html so `npm run report:open`
  // works as advertised.
  const generated = path.join(REPORT_DIR, 'html', 'index.html');
  const alias = path.join(REPORT_DIR, 'cucumber-report.html');
  if (await fs.pathExists(generated)) {
    await fs.copy(generated, alias);
  }

  console.log(`[generate-report] HTML report written to: ${alias}`);
})();