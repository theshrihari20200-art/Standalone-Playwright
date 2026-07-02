import { setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, Response } from 'playwright';
import { PageManager } from '../locators/POManager';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  pageLocator!: PageManager;

  /**
   * HTTP responses with status >= 400 captured via `page.on('response')` in
   * the Before hook. Used by TC3d to assert the silent 400 that the server
   * emits when an invalid image URL is submitted (UX-2).
   */
  consoleResponses: Response[] = [];

  /**
   * Console error messages captured via `page.on('console')`. Useful as a
   * diagnostic when an assertion fails; not currently asserted on directly.
   */
  consoleErrors: string[] = [];
}
setWorldConstructor(CustomWorld);