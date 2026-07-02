import { Before, After } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { CustomWorld } from './world';
import { PageManager } from '../locators/POManager';

Before(async function (this: CustomWorld) {
  // Reset per-scenario capture arrays before launching the browser so that
  // a previous failure cannot pollute the next scenario's assertions.
  this.consoleResponses = [];
  this.consoleErrors = [];

  this.browser = await chromium.launch({ headless: false });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.pageLocator = new PageManager(this.page);

  // Capture HTTP responses with status >= 400 (used by TC3d to detect the
  // silent 400 the server emits for an invalid image URL — UX-2).
  // We capture `self` so the arrow callback can push into the world.
  const self = this;
  this.page.on('response', (response) => {
    if (response.status() >= 400) {
      self.consoleResponses.push(response);
    }
  });

  // Capture console error messages as a diagnostic stream.
  this.page.on('console', (msg) => {
    if (msg.type() === 'error') {
      self.consoleErrors.push(msg.text());
    }
  });

  await this.page.goto('https://eventhub.rahulshettyacademy.com/');
});

After(async function (this: CustomWorld) {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});