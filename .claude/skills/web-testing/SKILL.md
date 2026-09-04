---
name: web-testing
description: Write end-to-end browser tests for this React shop with Playwright. Use when asked to test a user-facing workflow (cart, auth, checkout), to reproduce a UI bug in the browser, or to add or debug Playwright specs under e2e/.
---

# Web Testing

## Goal

Produce Playwright end-to-end tests that exercise real user workflows through the
running application, so that a passing suite is evidence the workflow works — not
evidence that the test was written to match the implementation.

Adapted from the course starter at `skill-template/web-testing/SKILL.MD`.

## Understand the Application

Before writing tests:

- Read the page/component that owns the workflow and the context that holds its
  state (`src/pages/*`, `src/context/*`). Note where state lives — this app keeps
  the cart in `localStorage["cart"]` and users in `localStorage["users"]`, so each
  Playwright browser context starts empty and tests are naturally isolated.
- Derive expected values from the source of truth (`src/data/products.js`), not
  from a screenshot. Prices here carry a `discount` percentage: the cart total uses
  `price * (1 - discount/100)`, so a product's total is *not* its sticker price.
- Map out gating and redirects before asserting: `/checkout` redirects to `/` when
  the cart is empty, the Place Order button only renders for a logged-in user, and
  the success screen auto-redirects home after 5 seconds.
- Open the app in the browser and walk the flow once manually before codifying it.

## Identify Test Cases

When deciding what to test:

- One happy path end to end, asserting the *state change*, not just that a click
  happened (order placed → success screen shown → cart emptied).
- The unsuccessful interactions the UI actually defends against: required fields,
  format rules (email pattern, 10-digit phone), min/max length, and access gating
  (checkout while logged out, checkout with an empty cart).
- Edge cases at boundaries and around persistence: decrementing quantity to zero
  (removes the item), min/max length limits exactly at the boundary, reload
  mid-flow, direct URL navigation that skips earlier steps.

Consider successful interactions, unsuccessful interactions, and edge cases.

## Browser Interaction

When exploring the application:

- Drive the real app with the Playwright CLI (`npx playwright test`,
  `--headed`, `--debug`, `--ui`, `npx playwright codegen <url>`); let the config's
  `webServer` start the dev server so there is one source of truth for the URL.
- Inspect what the user sees: `getByRole`, `getByLabel`, `getByText`. If an element
  is unreachable by role or label, that is a finding about the app worth reporting —
  do not reach for a brittle CSS/nth-child selector as the first move.
- Prefer accessible names that already exist in this app: `Add to Cart`,
  `Increase quantity`, `Decrease quantity`, `Remove item`, `Place Order`, and the
  `Log In` / `Sign Up` buttons on `/auth`.
- Scope assertions to a region (`page.getByRole("row", …)`, a summary card, a form)
  when the same text appears more than once on the page — a bare text match will
  hit the wrong node.

## Writing Tests

When creating automated tests:

- Put specs in `e2e/*.spec.js`; Vitest is excluded from that directory so unit and
  e2e suites stay separate.
- Reach the state under test through the UI, not by seeding `localStorage`, unless
  the setup is long and unrelated to what the test asserts; then say so in a comment.
- Use web-first assertions (`await expect(locator).toHaveText(...)`) so Playwright
  retries; never `waitForTimeout` to paper over a race.
- Keep shared setup (log in, add N items) in small helpers at the top of the spec,
  and give each test a name that states the expected behavior.
- Never change application code to make a test pass. If the app is wrong, keep the
  failing test, and report the defect separately.

## Verification

After creating tests:

1. Run the full suite: `npx playwright test`.
2. Re-run to confirm stability, and check the report / trace for failures
   (`npx playwright show-report`, `--trace on`).
3. Confirm each test fails for the right reason — break the expected value or skip a
   step and check the test catches it — so a passing suite means something.

If a test fails:

- Read the actual-vs-expected in the report and the trace before editing anything.
- Decide which of three it is: a wrong expectation (fix the test), a flaky wait
  (fix the assertion), or a real application defect (keep the test failing and
  report it).

## Completion Criteria

Testing is complete when:

- The workflow is covered by successful, unsuccessful, and edge-case tests, each
  asserting an observable state change.
- The suite passes twice in a row from a clean run with no application code changed,
  and any defect found is written up rather than worked around.
