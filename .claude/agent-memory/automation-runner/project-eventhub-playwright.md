---
name: eventhub-playwright-architecture
description: EventHub Cucumber+Playwright architecture, conventions, and JSON test-spec schema
metadata:
  type: project
---

EventHub test suite architecture and conventions (verified 2026-06-23).

**Stack**
- `@cucumber/cucumber` + Playwright (`playwright` package, not `@playwright/test` for browser) — `src/tests/support/hooks.ts` imports `chromium` from `'playwright'`. Step files import `expect` from `@playwright/test` (the runtime is the same).
- `cucumber.js` requires `ts-node/register` and globs `src/tests/steps/**/*.ts` plus `src/tests/support/**/*.ts`. Load order is significant: `test.ts` is required explicitly first so its step definitions register before the glob.
- Default timeout: 20s (overridable per-step).
- `npm test` is wired: `cucumber-js --format json:reports/cucumber-report.json`. `npm run test:full` chains `npm test && npm run test:report`.

**World + hooks**
- `CustomWorld` (`src/tests/support/world.ts`) has `browser`, `context`, `page`, `pageLocator`. `Before` launches chromium with `headless: false`, creates context + page, builds `PageManager(this.page)`, and navigates to `https://eventhub.rahulshettyacademy.com/`. `After` closes page → context → browser.
- Each scenario gets a fresh world and starts on the EventHub root.

**POManager pattern** (`src/tests/locators/POManager.ts`)
- Lazy-initialized private fields + public getters. New page objects: add file under `src/tests/locators/`, expose `get <name>Page()` mirroring `get registrationPage()`. Steps reference via `this.pageLocator.<name>Page.<locator>`. Do not construct page objects inside step files.
- Currently exposes `testPage` (login+register legacy) and `registrationPage`.

**Locator convention** (mirrors `src/tests/locators/registration.locator.ts`)
- Semantic queries (`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`) for form controls, scoped to a parent `form` Locator when a page could contain multiple forms.
- `data-testid="<field>-error"` for field-level validation messages.
- `.error-message` / `.success-message` for form-level banners.
- `Playwright` auto-waiting; no `waitForTimeout`.

**JSON test-spec schema** (from `features/add-new-event-spec.json`)
- Top level: `feature` (string), `description`, `feature_meta` (name/file/tags/owner/actors), `target` (baseUrl, addEventUrl, browser, headless, credentials, pageObject, pageObjectPath), `requirements[]` (id, title, type, priority, actors, preconditions, acceptance_criteria, linked_test_cases), `test_cases[]` (id, requirement_id, title, scenario_type, tags, given/when/then as string arrays, examples with headers+rows), `scenarios[]` (the executable Gherkin — name, tags, steps with keyword+text, examples), `traceability_matrix[]`, `scenario_outline_examples_summary[]`, `assumptions[]`.
- `scenarios[]` is the source of truth for the generated `.feature` file. The `test_cases[]` block is the QA-traceable companion.
- Assumptions explicitly call out that the live DOM may differ — error message strings and selectors are placeholders, expected to be revised once the form is inspected.

**Running the suite**
- `npx cucumber-js features/<name>.feature --format json:reports/cucumber-report.json`
- HTML report: `node scripts/generate-report.js` (script was missing in this checkout, must be created matching the `multiple-cucumber-html-reporter` API — see [[add-event-feature-implementation]]).

**Known gotchas** (from CLAUDE.md, verified)
- `errorMessage` in `test.locator.ts` is dead.
- `playwright.config.ts` has a hard-coded macOS `testDir`; not used by Cucumber.
- The legacy `test.ts` has hardcoded credentials in source — move to env when actually used.
