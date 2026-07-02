import { Page } from '@playwright/test';
import { TestPage } from '../locators/test.locator';
import { AdminEventsPage } from '../locators/admin-events.locator';

export class PageManager {
    constructor(private page: Page) { }

    private _testPage?: TestPage;
    private _adminEventsPage?: AdminEventsPage;

    get testPage(): TestPage {
        if (!this._testPage) {
            this._testPage = new TestPage(this.page);
        }
        return  this._testPage;
    }

    get adminEventsPage(): AdminEventsPage {
        if (!this._adminEventsPage) {
            this._adminEventsPage = new AdminEventsPage(this.page);
        }
        return this._adminEventsPage;
    }
}