import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world"; 

// --- LOGIN PAGE ---
Given('I open the login page', async function (this: CustomWorld) {
  await this.page.goto('https://eventhub.rahulshettyacademy.com/login');
  await this.page.waitForLoadState('domcontentloaded');
});

Given('user login into the app', { timeout: 30000 }, async function (this: CustomWorld) {
  // Utilizing your PageManager from hooks.ts/world.ts
  const testPage = this.pageLocator.testPage;

  // Wait for inputs to be visible before filling (relying on corrected placeholders in testlocator.ts)
  await testPage.userEmailInput.waitFor({ state: 'visible', timeout: 10000 });
  await testPage.userEmailInput.fill('manish123@gmail.com');

  await testPage.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await testPage.passwordInput.fill('Manish9@@');

  await testPage.signInButton.waitFor({ state: 'visible', timeout: 10000 });
  await testPage.signInButton.click();

  await this.page.waitForTimeout(5000);
});

Then('the page title should contain {string}', async function (this: CustomWorld, text: string) {
  await this.page.waitForLoadState('domcontentloaded');
  const title = await this.page.title();
  expect(title).toMatch(new RegExp(text, 'i'));
});

// --- REGISTRATION PAGE ---
// Keep registration steps in registration.steps.ts for clarity