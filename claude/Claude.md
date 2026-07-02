# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Core Commands

| Action | Command | Description |
|--------|---------|-------------|
| Install dependencies | `npm ci` | Installs exact versions from `package-lock.json`. |
| Build TypeScript | `npm run build` | Compiles `src/**/*.ts` to `dist/`. |
| Lint code | `npm run lint` | Runs ESLint with project‑specific rules. |
| Run tests | `npm test` | Executes Playwright + Cucumber tests. |
| Run a single test file | `npm test -- <path/to/file>.ts` | Executes only the specified test file. |
| Run a single scenario | `npm test -- --name <scenario-name>` | Executes the scenario matching the given name. |
| Open Playwright UI | `npx playwright test --reporter=html` | Generates an HTML report; open `playwright-report/index.html`. |
| Run tests in headed mode | `npm test -- --headed` | Opens the browser UI (useful for debugging). |

> **Note:** All scripts are defined in `package.json` under the `"scripts"` section.

---

## 2. High‑Level Architecture

The repository follows a typical **Playwright + Cucumber** BDD setup:

1. **`src/features/`** – Contains `.feature` files that describe business scenarios in Gherkin syntax.
2. **`src/tests/steps/`** – Step definition files (`.ts`) that implement the actions for each step.  
   - Each step file imports the `CustomWorld` type to access the shared test context (`page`, `browser`, etc.).
3. **`src/tests/support/`** – Supporting code such as hooks and world definitions.  
   - `hooks.ts` sets up/tears down the Playwright browser, context, and page, and injects a `PageManager` instance for page‑level interactions.
   - `world.ts` defines the `CustomWorld` interface, extending the default Cucumber world with Playwright objects.
4. **`src/tests/locators/`** – Page‑object factories.  
   - `POManager.ts` provides a `PageManager` class that lazily creates a `TestPage` (a wrapper around Playwright’s `Page`).  
   - Individual locator files (e.g., `test.locator.ts`) expose page‑specific methods.
5. **`src/tests/setup/`** – Optional utilities for test data, custom matchers, or reusable helpers.
6. **`playwright.config.ts`** – Global Playwright configuration (browser launch settings, project matrix, reporters, etc.).
7. **`tsconfig.json`** – TypeScript configuration with `"module": "ESNext"` / `"esModuleInterop": true` to support ESM imports used throughout the project.

### Data Flow

```
Feature (.feature) 
   → Step Definitions (.ts) 
        → Support Hooks (hooks.ts) 
            → Locator Manager (POManager.ts) → Page API
```

The **`CustomWorld`** acts as a bridge, exposing `browser`, `context`, `page`, and `pageLocator` to all step files, ensuring isolation between scenarios while sharing a single launch cycle.

---

## 3. Key Files & Locations

| File | Path | Purpose |
|------|------|---------|
| `src/features/**/*.feature` | `src/features/` | Gherkin scenario files. |
| `src/tests/steps/**/*.ts` | `src/tests/steps/` | Step implementations. |
| `src/tests/support/hooks.ts` | `src/tests/support/hooks.ts` | Global test lifecycle (launch, context, page). |
| `src/tests/support/world.ts` | `src/tests/support/world.ts` | Extends Cucumber world with Playwright types. |
| `src/tests/locators/POManager.ts` | `src/tests/locators/POManager.ts` | Page‑object manager; lazy‑initializes page interactions. |
| `src/tests/locators/*.ts` | `src/tests/locators/` | Individual page‑specific locator/utility modules. |
| `playwright.config.ts` | project root | Central Playwright configuration (browser, devices, reporters). |
| `tsconfig.json` | project root | TypeScript compiler options, especially `"module": "ESNext"` / `"esModuleInterop": true` to enable the ESM import style used throughout. |
| `.cursor/rules/*` or `.cursorrules` | `.cursor/` | Cursor‑specific coding rules (if present). |
| `.github/copilot-instructions.md` | `.github/` | Copilot configuration directives (if present). |
| `README.md` | project root | Project overview and additional instructions. |

---

## 4. Typical Development Workflow

1. **Add/modify a scenario** – Edit a `.feature` file in `src/features/`.
2. **Implement step definitions** – Create or update the corresponding step file(s) under `src/tests/steps/`.  
   - Ensure the step signature matches the Gherkin text exactly (including quotes and wording).  
   - Access shared state via `this` (the `CustomWorld` instance).
3. **Provide page interactions** – Use the `PageManager` (imported from `../locators/POManager.ts`) to expose page‑level actions.  
   - If a new page action is required, extend `TestPage` in `src/tests/locators/test.locator.ts` and expose it through `PageManager`.
4. **Run isolated tests** –  
   ```bash
   npm test -- path/to/your-step-file.ts
   ```  
   - Use `--name "<Scenario Name>"` to target a specific scenario.
5. **Debug visually** –  
   ```bash
   npm test -- --headed
   ```  
   - Opens a headed browser window, allowing inspection of DOM elements and network calls.
6. **Run full suite & view report** –  
   ```bash
   npm test
   ```  
   - Generates `playwright-report/index.html` for detailed pass/fail information.

---

## 5. Linting & Type‑Safety

- **ESLint** enforces coding style; failures block commits.  
- **TypeScript** is strict (`noImplicitAny`, `strictNullChecks`).  
- All public exports from `src/tests/locators/` and `src/tests/support/` are typed, preventing runtime mismatches.

When adding new utilities or page objects, remember to:

- Add proper TypeScript typings (interface or class) in the same file or a dedicated `.d.ts` if shared.  
- Import with the **`.ts` extension** to stay compatible with Node’s ESM resolver.

---

## 6. Common Pitfalls & Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Error: Cannot find module './locators/POManager'` | Missing `.ts` extension in the import. | Import as `../locators/POManager.ts`. |
| Tests start but never reach a step | Global `await` missing or asynchronous setup not awaited. | Ensure `Before` hook `await`s all async operations and returns a proper promise. |
| Browser stays open after test suite | `After` hook not properly closing resources. | Verify that `await this.page.close()`, `await this.context.close()`, and `await this.browser.close()` are all called. |
| Type errors on `pageLocator` | `PageManager` not exported with the correct extension or missing export. | Confirm `export class PageManager` exists and is exported from `POManager.ts`. |

---

## 7. Extending the Framework

- **New Page Object** – Create a file under `src/tests/locators/` (e.g., `login.locator.ts`) that exports methods for interacting with that page.  
  - Add a corresponding method to `PageManager` that returns an instance of the new locator.
- **Custom World Extensions** – Add new properties to `src/tests/support/world.ts` (e.g., `apiClient`, `mockServer`) and update the `CustomWorld` interface accordingly.
- **Additional Reporters** – Update `playwright.config.ts` under the `reporter` field to include formats like `json`, `junit`, or `allure-playwright`.

---

## 7. References

- **Playwright Documentation** – https://playwright.dev/docs/intro  
- **Cucumber for TypeScript** – https://github.com/cucumber/cucumber-js  
- **ESM Import Rules in Node** – Node.js documentation on file extensions for `import` statements.  

---

## 8. Registration Test Agent

A self-contained Cucumber agent for the EventHub registration page lives at:

- `features/registration.feature` — Gherkin scenarios (happy path + per-field validation)
- `src/tests/steps/registration.steps.ts` — step definitions
- `src/tests/locators/registration.locator.ts` — `RegistrationPage` page object
- `src/tests/locators/POManager.ts` — exposes `registrationPage` getter

### How to run

```bash
# Run the whole BDD suite (login + registration)
npm test

# Run only the registration feature
npm run test:registration

# Run only the smoke-tagged happy path
npm run test:smoke

# Run a single scenario by name
npx cucumber-js --name "Successful registration with valid inputs"

# Run only @email or @password or @confirm scenarios
npx cucumber-js --tags "@registration and @email"
npx cucumber-js --tags "@password"
npx cucumber-js --tags "@confirm"

# Type-check the TypeScript without running
npm run typecheck
```

Tags applied: `@registration` (all), `@smoke` (happy path), `@happy`, `@email`, `@password`, `@confirm`, `@duplicate`, `@empty`, `@regression`.

### What it covers

- **Email field** — invalid formats, missing parts, empty, duplicate
- **Password field** — short (<8), missing uppercase / lowercase / digit / special, empty
- **Confirm password** — value mismatch (including case-only and trailing char), empty

### Known caveats

- The page object assumes the registration form exposes `[data-testid="email-error"]`, `[data-testid="password-error"]`, `[data-testid="confirm-password-error"]` spans for field-level messages. If the live DOM uses different attributes, update the locators in `registration.locator.ts`.
- Happy-path success and duplicate-email error use literal strings (`"Account created successfully"`, `"Email already exists"`) — adjust if the live site shows different copy.
- The `Before` hook in `src/tests/support/hooks.ts` still navigates to the EventHub root first; `I open the registration page` then re-navigates to `/register`. This is intentional so other features are unaffected.

--- 

*End of CLAUDE.md*