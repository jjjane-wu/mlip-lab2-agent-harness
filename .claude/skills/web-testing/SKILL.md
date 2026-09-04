---
name: web-testing
description: Write end-to-end browser tests for this React shop with Playwright. Use when asked to test a user-facing workflow (cart, auth, checkout), to reproduce a UI bug in the browser, or to add or debug Playwright specs under e2e/.
---

# Web Testing

## Goal

Produce Playwright end-to-end tests that exercise real user workflows through the
running application, so that a passing suite is evidence the workflow works — not
evidence that the test was written to match the implementation.

Adapted from the course starter at `skill-template/web-testing/SKILL.MD`, then
revised from the trace of the first checkout run (see "Lessons from the trace").

## Understand the Application

Before writing tests:

- Read the page/component that owns the workflow and the context that holds its
  state (`src/pages/*`, `src/context/*`). Note where state lives — this app keeps
  the cart in `localStorage["cart"]` and users in `localStorage["users"]`, so each
  Playwright browser context starts empty and tests are naturally isolated.
- Derive expected values from the source of truth by importing it into the spec
  (`import { getProducts } from "../src/data/products.js"`), not by copying numbers
  out of a screenshot. Prices here carry a `discount` percentage: the cart total uses
  `price * (1 - discount/100)`, so a product's total is *not* its sticker price.
- Map out gating and redirects before asserting: `/checkout` redirects to `/` when
  the cart is empty, the Place Order button only renders for a logged-in user, and
  the success screen auto-redirects home after 5 seconds.
- Check which fields are **prefilled** before testing validation. Checkout prefills
  Name and Email from the signed-in user, so "required field" tests must
  `fill("")` first — submitting an untouched form does not exercise the rule.
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
- Timed behavior deserves its own test (the 5s post-order redirect), asserted with a
  generous assertion timeout rather than a sleep.

Consider successful interactions, unsuccessful interactions, and edge cases.

## Browser Interaction

When exploring the application:

- Drive the real app with the Playwright CLI (`npx playwright test`,
  `--headed`, `--debug`, `--ui`, `npx playwright codegen <url>`); let the config's
  `webServer` start the dev server so there is one source of truth for the URL and
  no stray server to clean up.
- Inspect what the user sees: `getByRole`, `getByLabel`, `getByText`. If an element
  is unreachable by role or label, that is a finding about the app worth reporting —
  do not reach for a brittle CSS/nth-child selector as the first move.
- Prefer accessible names that already exist in this app: `Add to Cart`,
  `Increase quantity`, `Decrease quantity`, `Remove item`, `Place Order`, and the
  `Log In` / `Sign Up` buttons on `/auth`.
- **Expect duplicate accessible names and resolve them by container, not by index.**
  `/auth` renders two `Sign Up` buttons — the mode toggle and the form's submit —
  so scope them (`page.locator("form").getByRole("button", { name: "Sign Up" })`
  vs `page.getByRole("paragraph").getByRole(...)`). Reach for `.nth()` only when
  position is genuinely the thing being tested.
- **Prefer the route where the control is unique.** The home grid has one
  `Add to Cart` per card; `/products/:id` has exactly one. Adding from the details
  page removed the need for index-based selection entirely.
- For tabular data, scope to the row and then the cell:
  `page.getByRole("row").filter({ hasText: name }).getByRole("cell").nth(2)`.
  A bare text match hits the wrong node when a total repeats a line value.

## Writing Tests

When creating automated tests:

- Put specs in `e2e/*.spec.js`. Vitest's default glob also matches `*.spec.js`, so
  keep `e2e/**` in the Vitest `exclude` list — otherwise `npm test` tries to run
  Playwright specs in jsdom and fails confusingly.
- Reach the state under test through the UI, not by seeding `localStorage`, unless
  the setup is long and unrelated to what the test asserts; then say so in a comment.
- Use web-first assertions (`await expect(locator).toHaveText(...)`) so Playwright
  retries; never `waitForTimeout` to paper over a race. For an element that is
  conditionally rendered (the cart badge at zero items), `toBeHidden()` /
  `toHaveCount(0)` says what you mean; `toBeVisible()` negations do not.
- Keep shared setup (sign up, add N items) in small helpers at the top of the spec,
  and give each test a name that states the expected behavior.
- Never change application code to make a test pass. When the app is genuinely
  wrong, keep the test that asserts correct behavior and mark it `test.fail()` with
  a comment naming the two files that disagree — the suite stays green, the defect
  stays visible, and the test flips to failing the moment someone fixes it.

## Watch for validation the browser handles before the app does

Native constraint validation runs *before* the submit handler, so an input with
`type="email"` silently blocks submission on `"not-an-email"` and the app's own
error message never renders — the test then asserts on a message that cannot appear.
Choose inputs that clear the native check but fail the app's rule (`"user@example"`
passes the browser, fails the app's `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Fields with no
native constraint (`type="tel"`) need no such care. When a validation test fails to
find its message, check for native interception before assuming the rule is missing.

## Verification

After creating tests:

1. Run the full suite: `npx playwright test`.
2. Re-run to confirm stability, and check the report / trace for failures
   (`npx playwright show-report`, `--trace on`).
3. **A first run that passes everywhere proves nothing yet.** Mutate one expected
   value (e.g. an item count 3 → 4), confirm the test fails with a sensible
   actual-vs-expected, then revert. Do this at least for the happy path's key
   assertion; without it, a green suite may just be asserting on nothing.
4. Run `npm test` too, to confirm the e2e work did not disturb the unit suite.

If a test fails:

- Read the actual-vs-expected in the report and the trace before editing anything.
- Decide which of four it is: a wrong expectation (fix the test), a flaky wait
  (fix the assertion), a selector that matched the wrong node (scope it), or a real
  application defect (keep the test and report it — do not patch the app).

## Completion Criteria

Testing is complete when:

- The workflow is covered by successful, unsuccessful, and edge-case tests, each
  asserting an observable state change.
- The suite passes twice in a row from a clean run with no application code changed.
- At least one assertion has been mutation-checked.
- Any defect found is written up (or pinned with `test.fail()`) rather than worked
  around.

## Lessons from the trace

From the first checkout run, in the order they cost time:

1. Duplicate accessible names (`Sign Up`) trip strict mode — scope by container.
2. Choosing `/products/:id` over the home grid made `Add to Cart` unambiguous.
3. Native `type="email"` validation hides the app's own error message.
4. Prefilled Name/Email meant "required field" tests had to clear them first.
5. Vitest's glob collected `e2e/*.spec.js` until `e2e/**` was excluded.
6. Everything passed on the first run; the mutation check is what made that
   trustworthy.
7. The one genuine bug (order-summary lines ignore the discount the Total applies)
   surfaced only because expected money values came from `products.js` rather than
   from the rendered page.
