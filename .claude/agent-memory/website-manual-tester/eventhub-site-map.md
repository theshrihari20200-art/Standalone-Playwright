---
name: eventhub-site-map
description: EventHub (eventhub.rahulshettyacademy.com) — confirmed selectors, routes, validation patterns, and session model, useful for future registration/login-related test cases.
metadata:
  type: project
---

EventHub (https://eventhub.rahulshettyacademy.com/) is a Next.js app with role-aware UI. Confirmed site facts (last verified 2026-06-25):

- Register form is at `/register`. Three fields: `#register-email` (email), `#register-password` (password, type=password), and an UN-IDED confirm-password (placeholder `Repeat your password`, selector fallback `form input[type="password"]:not(#register-password)`). Submit button is `#register-btn` (text `Create Account`). Form is `novalidate`.
- Register password policy: min 8 chars + uppercase + digit + symbol. Verified accepted: `Test1234!Aa`.
- Login form at `/login` has `#email` and `#password` (both with ids — unlike register). Submit `#login-btn` (`Sign In`). Wrong creds show inline `Invalid email or password`. Duplicate-email register shows inline `Email already registered`.
- Logout is a `<button id="logout-btn" data-testid="logout-btn">Logout</button>` in the header — no menu, no confirmation. After logout every auth-only route (e.g. `/bookings`) redirects to `/login`.
- Session token is a JWT in `localStorage['eventhub_token']`. NO cookies set. Logout wipes localStorage.
- Post-register URL = post-login URL = `https://eventhub.rahulshettyacademy.com/`. Header for authed users: `EventHub / Home / Events / My Bookings / API Docs / Admin (admin only) / <email> / Logout`.
- Validation errors render inline as visible text but do NOT use `[role=alert]`, `.error-message`, or `.text-red-*` reliably — match by visible text or do a body-text scan.
- The seeded admin email is `manish123@gmail.com` (password `Manish9@@`) — only this user sees the Admin nav link.

Why: prevents re-discovering the same selectors and validation quirks in future test runs in this repo.

How to apply: when adding new BDD scenarios that touch register/login/logout/session, reuse these selectors and the localStorage token check rather than probing from scratch.