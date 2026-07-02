---
name: eventhub-output-conventions
description: Manual-test-case JSON shape and output-folder conventions used in this PlaywrightProject repo.
metadata:
  type: project
---

This repo's manual-tester output convention (observed in `manual-test-cases/` and the `bdd-automation-builder` agent description):

- Output folder: `manual-test-cases/` at repo root. Folder already contains prior dated artifacts (`_admin.json`, `_boundary.json`, `add-event-2026-06-25.json`, etc.) and dated PNG screenshots.
- Naming: `<feature>-<YYYY-MM-DD>.json`. For registration/login the file is `register-login-2026-06-25.json`.
- JSON shape expected by the bdd-automation-builder: `metadata`, `registrationEntryPoint`, `logoutEntryPoint`, `loginEntryPoint`, `registrationFormFields`, `loginFormFields`, `testCases[]` (each with `id`, `title`, `priority`, `type`, `preconditions`, `steps[]`, `expectedResult`, `executionStatus`, `executionNotes`, `data`), `observations[]`.
- Every form field MUST carry a canonical `selector` (not just a label) — the builder needs it to generate Playwright locators.
- Test cases must be exercised live when reasonable; mark `executionStatus: \"not-executed\"` only with a reason.

Why: the bdd-automation-builder agent is downstream of this output. Missing selectors or missing `executionStatus` block its Gherkin generation.

How to apply: when this agent produces manual test-case JSONs, structure them to match the schema above and exercise every test case live when feasible.