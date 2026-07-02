# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Common Commands

There is no test runner wired up in `package.json` — the `"scripts"` object is empty. The intended commands are:

| Action | Command |
|--------|---------|
| Install dependencies | `npm ci` (or `npm install` — there is no lockfile-pinned CI install yet) |
| Run the BDD suite | `npx cucumber-js` (reads `cucumber.js`) |
| Run a single scenario by name | `npx cucumber-js --name "User opens login page"` |
| Run scenarios with a tag | `npx cucumber-js --tags @test` |
| Run a specific step file only | `npx cucumber-js --require src/tests/steps/test.ts` |
| Type-check | `npx tsc --noEmit` |
| Run the (currently broken) Playwright config | `npx playwright test` — see "Caveats" below |

CI runs `npx playwright test` (see `.github/workflows/playwright.yml`), not the Cucumber suite. The two runners are not coordinated — see "Caveats".

---

## 2. High‑Level Architecture

This is a **Cucumber BDD suite on top of Playwright**, targeting the public **EventHub** app at `https://eventhub.rahulshettyacademy.com/`. Tests are written in Gherkin, executed by `@cucumber/cucumber`, which drives Playwright via hooks.

### Data flow

```
features/*.feature                  ← Gherkin scenarios (Cucumber entry point)
   ↓ matched by
src/tests/steps/test.ts             ← Step definitions (Given/When/Then)
   ↓ uses
src/tests/support/hooks.ts          ← Before/After: launches chromium, builds page
   ↓ attaches
src/tests/support/world.ts          ← CustomWorld: { browser, context, page, pageLocator }
   ↓ uses
src/tests/locators/POManager.ts     ← Lazy-initialized page-object manager
   ↓ returns
src/tests/locators/test.locator.ts  ← TestPage: locators for login + register
```

Every scenario gets a fresh `CustomWorld` from the `Before` hook. The hook also navigates to the EventHub root, so steps can call `this.page.goto(...)` to jump to a specific route. Steps access the page through `this.pageLocator.testPage.<locator>`.

### The `PageManager` / `TestPage` pattern

`POManager` exposes a single `testPage` getter that lazily constructs a `TestPage` from the Playwright `Page`. To add a new page object, create a new file under `src/tests/locators/`, add a getter on `POManager` mirroring the `testPage` one, and reference it from steps via `this.pageLocator.<name>`. Do not construct page objects directly inside step files.

### Cucumber configuration

`cucumber.js` registers `ts-node/register` and loads step + support files via glob. Step files use the `Given/When/Then` API from `@cucumber/cucumber`; scenarios are timed out at 20s by default, with per-step overrides where needed (see the registration flow in `test.ts`).

### Playwright configuration

`playwright.config.ts` exists but is **not used by the Cucumber suite**. It points `testDir` at an absolute macOS path that does not exist on this checkout, and CI runs `npx playwright test` against it. See "Caveats" before changing it.

---

## 3. Key Files

- `features/test.feature` — the only Gherkin file; three scenarios (login page, login+booking, register).
- `src/tests/steps/test.ts` — the only active step file. `example.spec.ts` is dead boilerplate and can be ignored.
- `src/tests/support/hooks.ts` — single source of truth for browser lifecycle. Headed mode is hard-coded (`headless: false`); flip it for CI.
- `src/tests/support/world.ts` — `CustomWorld` is the type every step signature references.
- `src/tests/locators/test.locator.ts` — currently bundles login *and* register locators. The login and register email fields share the same placeholder selector (`you@email.com`); this is fine only because each page is loaded exclusively per scenario.
- `cucumber.js` — load order matters: `steps/test.ts` is required before the `steps/**/*.ts` glob so its step definitions are registered first.

---

## 4. Caveats / Known Issues

These will trip up future work and should be addressed before relying on the suite in anger:

- **`package.json` `scripts` is empty.** `npm test`, `npm run build`, `npm run lint` all fail with "Missing script". The CI workflow does not use `npm test` — it calls `npx playwright test` directly.
- **`playwright.config.ts` has a hard-coded macOS `testDir`.** `/Users/manishkumar/AI Projects/playwright/src/tests` — will not resolve on any other machine, including this Windows checkout. Either delete the file, fix the path, or remove the Playwright workflow until it's actually wired to real tests.
- **`typescript: ^6.0.3` in devDependencies is invalid** (TypeScript 6 does not exist). `npm install` will fail or pull a bogus version. Pin to a real release (e.g. `^5.x`) before installing.
- **Hardcoded credentials** in `src/tests/steps/test.ts` (`manish123@gmail.com` / `Manish9@@`). `.env` is in `.gitignore`, so move these to environment variables and read with `process.env` — this is the only blocker for committing the suite.
- **CI runs `npx playwright test`, not Cucumber.** The workflow at `.github/workflows/playwright.yml` exercises the broken `playwright.config.ts` and never runs the actual Gherkin scenarios. Pick one runner as the source of truth.
- **`errorMessage` locator is defined but never used** in `test.locator.ts`. Safe to remove or wire up.
- **`@cucumber/cucumber` types vs `playwright` types.** `world.ts` and `hooks.ts` import `Browser`/`BrowserContext`/`Page` from `playwright`, while step files import `expect` from `@playwright/test`. Both work because they re-export the same Playwright runtime, but be consistent within a single file.
- **The `claude/Claude.md` file in the repo is stale** and contradicts the actual code (e.g. claims `src/features/` exists, claims `tsconfig.json` is ESNext, lists scripts that aren't in `package.json`). Don't trust it — this file supersedes it.

---

## 5. Extending the Suite

- **New scenario** → append to `features/test.feature`, then implement any new `Given/When/Then` in `src/tests/steps/test.ts` (or a new file — the glob picks it up).
- **New page object** → new file under `src/tests/locators/`, expose a lazy getter on `PageManager`, reference from steps.
- **New shared state on the world** → add a property to `CustomWorld` in `world.ts` and assign it in `hooks.ts` (e.g. an `apiContext`).
- **Toggling headed mode** → `chromium.launch({ headless: true|false })` in `hooks.ts`. CI should use `headless: true` plus `process.env.CI` as the gate.
