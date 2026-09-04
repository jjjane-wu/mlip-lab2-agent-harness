import { test, expect } from "@playwright/test";

test("harness can drive the running app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to REBEX Shop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" }).first()).toBeVisible();
});
