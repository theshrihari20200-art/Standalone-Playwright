import { Page, Locator } from '@playwright/test';

export class TestPage {
  readonly page: Page;
  readonly userEmailInput: Locator;
  readonly passwordInput: Locator; // This stays a Locator
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Email selector
    this.userEmailInput = page.getByPlaceholder('Email'); 

    // 🌟 CHANGED HERE: Bulletproof selector using HTML input type instead of placeholder
    this.passwordInput = page.locator('input[type="password"]');
    
    // Sign In button selector
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.locator('.error-message');
  }
}