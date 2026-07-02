import { Page, Locator } from '@playwright/test';

/**
 * Page object for the inline add-event form on /admin/events and the
 * "All Events" table that sits below it.
 *
 * Selectors are taken verbatim from the JSON spec's `fieldSelectors` map.
 * Note that the `price` and `totalSeats` ids contain `$` and the
 * `dateTime` id contains `&`, so we use type + position selectors instead
 * of `#id` (UX-7). `errorRegion` covers all three red Tailwind shades the
 * app uses for inline validation copy (UX-8).
 */
export class AdminEventsPage {
  readonly page: Page;

  readonly form: Locator;
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly categorySelect: Locator;
  readonly cityInput: Locator;
  readonly venueInput: Locator;
  readonly dateTimeInput: Locator;
  readonly priceInput: Locator;
  readonly totalSeatsInput: Locator;
  readonly imageUrlInput: Locator;
  readonly submitButton: Locator;
  readonly errorRegion: Locator;
  readonly eventsTable: Locator;
  readonly eventsTableRows: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator('form#admin-event-form');
    this.titleInput = page.locator('input#event-title-input');
    this.descriptionTextarea = page.locator('textarea');
    this.categorySelect = page.locator('select#category');
    this.cityInput = page.locator('input#city');
    this.venueInput = page.locator('input#venue');
    this.dateTimeInput = page.locator('input[type="datetime-local"]');
    // The two number inputs: addressed by id. The spec uses type/nth-of-type
    // in its fieldSelectors map, but in practice that selector resolves to
    // two matches inside the form (UX-7 documents the special-character ids
    // as the root cause). We use `[id="..."]` attribute selectors with the
    // real ids from the spec — `total-seats` is safe, `price-($)` needs
    // CSS-string escaping. Scoped to the form so they never collide with
    // seat-count inputs that may appear in the management table below.
    this.priceInput = this.form.locator('input[id="price-($)"]');
    this.totalSeatsInput = this.form.locator('input#total-seats');
    this.imageUrlInput = page.locator('input[type="url"]');
    this.submitButton = page.locator('button#add-event-btn');
    this.errorRegion = page.locator('.text-red-500, .text-red-600, .text-red-700');

    // The "All Events" management table sits below the inline form on
    // /admin/events. We scope to a `<table>` to avoid matching chips/badges
    // outside the table.
    this.eventsTable = page.locator('table');
    this.eventsTableRows = page.locator('table tbody tr');
  }
}
